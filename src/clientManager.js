'use strict';

var ChangeType = require('./changeType');

var ClientManager = function ClientManager(config) {
    this.config = config;

    this.clientTopicMap = {}

    this.createTopicMap = function (config) {
        var result = {};
        config.listeners.forEach(listener => {

            result[listener.topic] || (result[listener.topic] = []);

        });
        return result;
    }

    this.clientTopicMap = this.createTopicMap(config);

    this.broadcast = function (topic, payload) {

        const clients = this.clientTopicMap[topic];
        const message = (typeof(payload) === "string") && payload || JSON.stringify(payload);
        clients.forEach(c => {
            if (c.connected) {
                c.sendUTF(message);
            }
        })
    }
}

ClientManager.prototype.removeConnection = function (connection, topic) {
    const map = this.clientTopicMap;

    var offset = map[topic].findIndex(e => e == connection);

    if (offset !== -1) {
        map[topic].splice(offset, 1);
    }
}

ClientManager.prototype.registerClientConnection = function (request, clientTopicMap) {
    var that = this;
    const map = clientTopicMap || this.clientTopicMap;
    const topic = request.requestedProtocols[0];

    var connection = request.accept(topic, request.origin);

    connection.on('close', function (reasonCode, description) {
        ClientManager.prototype.removeConnection.call(that, connection, topic);

        console.log(`Closed connection  ${connection.remoteAddress} because ${reasonCode} ${description}`);
        connection = null;
    });

    this.clientTopicMap[topic].push(connection);

    console.log(`Client accepted from ${connection.remoteAddress} for topic "${topic}".`)

    return { topic, connection };
}

module.exports = ClientManager;