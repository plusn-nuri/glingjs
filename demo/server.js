"use strict";

const config = require('./config');

const { ClientManager, Gling, ChangeType, WebSocketServerManager } = require('../src/index');

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocketServer = require('websocket').server;

// set up http web server, any other UI you want.
var httpServer = http.createServer((request, response) => {
    console.log('Request for ' + request.url);

    const fileName = path.join(__dirname, 'index.html');
    fs.readFile(fileName, 'utf8', (err, content) => {
        response.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': content.length });
        response.end(content);
    });
});

httpServer.listen(8080, function (s) {
    console.log('Server is listening on port 8080');
});

// set up Gling
var gling = new Gling(config);
var clientManager = new ClientManager(config);
var webSocketServerManager = new WebSocketServerManager(httpServer, clientManager);

gling.start((topic, payload) => clientManager.broadcast(topic, payload))
    .then(() => console.log('started..'))
    .catch(reason => {
        console.error(reason);
    });
