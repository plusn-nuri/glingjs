'use strict';
const http = require('http');
const ClientManager = require('./ClientManager');

const WebSocketServer = require('websocket').server;

class WebSocketServerManager {
    constructor(httpServer, clientManager) {
        this.webSocketServer = new WebSocketServer({
            httpServer: httpServer,
            autoAcceptConnections: false
        });
        this.clientManager = clientManager;

        this.webSocketServer.on('request', (request) => {
            const origin = (request.origin || request.host);
            if (!ClientManager.isOriginAllowed(origin, this.clientManager.config.allowedOrigins)) {
                request.reject();
                return;
            }

            const { topic, connection } = this.clientManager.registerClientConnection(request);
        });
    }
}

module.exports = WebSocketServerManager;