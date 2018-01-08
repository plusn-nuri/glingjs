"use strict";

var config = require('./config');

var Gling = require('../src/server/gling');
var ClientManager = require('../src/server/clientManager');

var http = require('http');
var WebSocketServer = require('websocket').server;

// set up websocket
var server = http.createServer((request, response) => {
    console.log('Request for ' + request.url);
    response.end('Nothing interesting');
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

    var { topic, connection } = clientManager.registerClientConnection(request);

    console.log(`Got request from ${connection.remoteAddress} for topic "${topic}".`);

});

var hook = (topic, payload)=>{
    console.log(`Broadcasting to clients of ${topic}`, payload);
    clientManager.broadcast(topic, payload);
}
var gling = new Gling(config);

gling.start(hook)
    .then(() => console.log('started..'))
    .catch(reason => {
        console.error(reason);
    });
