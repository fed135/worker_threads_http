/**
 * Request http worker
 */

/* Requires ------------------------------------------------------------------*/

const http = require('http');
const https = require('https');
const url = require('url');
const { parentPort, workerData } = require('worker_threads');

/* Local variables -----------------------------------------------------------*/

const keepAliveOptions = {
    keepAlive: true,
    keepAliveMsecs: process.env.NODE_KEEP_ALIVE_MSEC || 5000,
};

const protocols = {
    'http:': {
        client: http,
        agent: new http.Agent(keepAliveOptions),
    },
    'https:': {
        client: https,
        agent: new https.Agent(keepAliveOptions),
    },
};

/* Methods -------------------------------------------------------------------*/

function send(opts) {
    if (opts.workerId !== workerData.workerId) return null;

    if (opts.url) opts = Object.assign(opts, url.parse(opts.url));
    opts.family = 4; //(opts.hostname.split('.').length === 4 && Number(opts.hostname[opts.hostname.length -1]) == opts.hostname[opts.hostname.length -1]) ? 4 : 6;
    opts.agent = protocols[opts.protocol || 'http:'].agent;

    const errorHandler = handleError.bind(null, opts.uuid);
    const req = protocols[opts.protocol || 'http:'].client.request(opts, handleResponse.bind(null, opts.uuid));
    if (opts.body) req.write(opts.body);
    
    req.on('error', errorHandler);
    req.setTimeout(5000, errorHandler)

    req.end();
}

function handleResponse(uuid, res) {
    const response = {
        uuid,
        headers: res.headers,
        statusCode: res.statusCode,
        body: [],
    };

    res.on('data', chunk => response.body.push(chunk));
    res.on('end', () => {
        response.body = response.body.join('');
        parentPort.postMessage(response);
    });
}

function handleError(uuid, error) {
    parentPort.postMessage({
        uuid,
        error,
    });
}

/* Init ----------------------------------------------------------------------*/

parentPort.on('message', send);