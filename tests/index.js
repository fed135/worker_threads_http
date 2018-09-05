const http = require('../');
const httpServer = require('http').createServer;
const request = require('request');
const crypto = require('crypto');

const opts = {
    url: `http://google.ca/search?q=${crypto.randomBytes(4).toString('hex')}`,
    //json: true,
};

// MPR
/*httpServer((req, res) => {
    http.send(opts)
        .then((response) => {
            res.write(JSON.stringify(response.body));
            res.end();
        });
}).listen(8080);
*/

// Request
httpServer((req, res) => {
    request(opts, (err, response, body) => {
        res.write(JSON.stringify(body));
        res.end();
    });
}).listen(8080);