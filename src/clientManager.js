'use strict';

const ChangeType = require('./changeType');

class ClientManager {
    constructor(config) {
        this.config = config;
        this.clientTopicMap = ClientManager.createTopicMap(config);
    }

    static createTopicMap(config) {
        const result = config.listeners.reduce((accum, listener) => {
            if (!accum[listener.topic]) { accum[listener.topic] = []; }
            return accum;
        }, {});

        return result;
    }

    broadcast(topic, payload) {
        const clients = this.clientTopicMap[topic];
        const message = (typeof (payload) === "string") && payload || JSON.stringify(payload);
        clients.forEach(c => {
            if (c.connected) {
                c.sendUTF(message);
            }
        })
    }

    static removeConnection(connection, topic, map) {
        const offset = map[topic].findIndex(e => e == connection);

        if (offset !== -1) {
            map[topic].splice(offset, 1);
        }
    }

    registerClientConnection(request, clientTopicMap) {
        const map = clientTopicMap || this.clientTopicMap;
        const topic = request.requestedProtocols[0];

        var connection = request.accept(topic, request.origin);

        connection.on('close', (reasonCode, description) => {
           ClientManager.removeConnection(connection, topic, map);

            console.log(`Closed connection  ${connection.remoteAddress} because ${reasonCode} ${description}`);
            connection = null;
        });

        this.clientTopicMap[topic].push(connection);

        console.log(`Client accepted from ${connection.remoteAddress} for topic "${topic}".`)

        return { topic, connection };
    }
}

module.exports = ClientManager;