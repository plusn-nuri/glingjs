"use strict";

const config = require('./config');

const Gling = require('../src/server/gling');
const ClientManager = require('../src/server/clientManager');

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocketServer = require('websocket').server;

// set up websocket
var server = http.createServer((request, response) => {
    console.log('Request for ' + request.url);

    const fileName = path.join(__dirname, 'index.html');
    fs.readFile(fileName, 'utf8', (err, content) => {
        response.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': content.length });
        response.end(content);
    });
});

server.listen(8080, function (s) {
    console.log('Server is listening on port 8080');
});

var webSocketServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

var clientManager = new ClientManager(config);

webSocketServer.on('request', (request) => {
    if (!request.origin.isOriginAllowed(config.allowedOrigins)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var { topic, connection } = clientManager.registerClientConnection(request);

    console.log(`Got request from ${connection.remoteAddress} for topic "${topic}".`);
});

var hook = (topic, payload) => {
    console.log(`Broadcasting to clients of ${topic}`, payload);
    clientManager.broadcast(topic, payload);
}



var gling = new Gling(config);

gling.start(hook)
    .then(() => console.log('started..'))
    .catch(reason => {
        console.error(reason);
    });
