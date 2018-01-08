# GlingJS

The super easy way to make your website chime whenever something interesting happens.

## Description

TL;DR : **GlingJS** is a middleware connecting MongoDB Change Streams to your web page using web sockets.

Ever feel like your website is kind of "dead"? That a user on your site is lonely and isolated and unmotivated because they don't know about all the exciting actions _other users_ are performing?

Using **GlingJS**, users get lively notifications whenever something interesting happens.
Example notifications:

- "Pat just bought chamois"
- "Faradi just reviewed our Classic II Bird Cage"
- "Ohm just joined the Resistance group"
- "Volta unlocked a higher potential moments ago"

## Features

### Topic Separation
Multiple topics can be defined. This allows you to define multiple discrete notifications, each with its own notification data and trigger.

### Push Delivery
Notifications are pushed to the web page using web sockets. Web sockets can deliver more efficeient real time notifications and communication to the page without repeated polling or timer based requests from the browser.

### Configuration Driven Subscription
You define the triggering event, filter, and payload using declarations in configuration. The configuration allows you to control:
1. The change type you are interested in, such as an update or a new document insertion or a deletion.
1. The data fields returned from the server. This can be used to enrich or reduce the notification payload to include exactly the fields you are interested in.
1. The topic that the listener trigger represents

### Scale Out
Multiple servers can be set up with the same configuration to increase front-end capacity. This can allow more concurrently connected web browsers. Since the source of truth is MongoDB, there is not state management required in the node application itself beyond socket management.

## Usage

#### Configuration
``` javascript
'user strict';
var ChangeType = require('./changeType');

const Config = {
    connection: 'mongodb://localhost:27017/gling?replSet=r1',
    listeners: [
        {
            collection: 'users',
            when: [ChangeType.create],
            filter: { name: 'waldo' },
            fields: ['name'],
            topic: 'new-user'
        },
        {
            collection: 'memes',
            when: [ChangeType.create],
            filter: { about: 'cat' },
            fields: ['url'],
            topic: 'meme-cat'
        }
    ]
}

module.exports = Config;
```
#### Server
``` javascript
"use strict";

var config = require('./config');

var Gling = require('./gling');
var ClientManager = require('./clientManager');

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

```

