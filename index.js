/**
 * Multi-process request
 */

/* Requires ------------------------------------------------------------------*/

const crypto = require('crypto');
const { Worker, MessageChannel } = require('worker_threads');

/* Local variables -----------------------------------------------------------*/

const poolSize = 4;
const queue = new Map();
const pool = Array.from(new Array(poolSize)).map((a,b) => {
    return new Worker('./worker.js', { workerData: { workerId: b }});
});
const port = new MessageChannel();
let inc = 0;

/* Methods -------------------------------------------------------------------*/

function send(opts) {
    const uuid = crypto.randomBytes(8).toString('hex');
    const promise = new Promise((resolve, reject) => {
        queue.set(uuid, {
            resolve,
            reject,
            json: opts.json,
        });
    });

    opts.uuid = uuid;
    opts.workerId = inc;

    pool[inc].postMessage(opts);
    if (inc < poolSize -1) inc++;
    else inc = 0;
    
    return promise;
}

function resolve(query) {
    const handler = queue.get(query.uuid);
    if (query.error === undefined) {
        if (handler.json === true) {
            try {
                query.body = JSON.parse(query.body);
            }
            catch(e) {
                query.body = query.body;
            }
        }
        handler.resolve(query);
    }
    else {
        handler.reject(query.error);
    }
    queue.delete(query.uuid);
}

/* Init ----------------------------------------------------------------------*/

pool.forEach(f => f.on('message', resolve));

/* Exports -------------------------------------------------------------------*/

module.exports = { send };