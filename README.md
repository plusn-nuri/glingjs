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

### Configuration 
Configuration consists of essentially 3 things:
1. A MongoDB connection string
1. A list of listener definitions
1. A list of allowed origins

#### Connection String
The `connectin` field should contain a standard MongoDB connection string. Note that since Change Streams require OpLog, it is mandatory that the connection string contain a replica set name, using the `replset=<your_replica_set_name>` query string parameter.

#### Listener Definitions
The list of `listeners` defines the trigger and characteristics of the notifications you are interested in. Each item in the `listeners` array will produce a discrete subscription to a change stream. 

Describe a listener using the following fields

| Field | Description |
|--- | --- |
| `collection` | Collection name |
| `when` | The type of change to listen to, one of **create**, **update**, or **remove** |
| `filter` | A match expression to limit what criteria in the changed document will cause notification |
| `fields` | A list of fields which should be included in the notification payload. |
| `topic` | A label used to describe the topic of the notification |

The `topic` defined for a listener need not be unique. For example, you may define two listeners for the topic `new-message`, one when `create` occurs in the _instant__message_ collection, and one in the _email_ collection.

The `fields` items is not guaranteed to produce fields in the event payload. This is both because the fields may not exist for some documents, and since deleted documents may not return any data.

When specifying **update** in the `when` field, documents which were either updated or replaced will be returned. This follows the notion of "something happened to an existing document". Gling automatically requests the _documentLookup_ when an **update** change is requested and there are `fields` specified. If no `fields` are requested (empty array), the event payload will not return values beyond what MongoDB includes natively in a change notification.


#### Allowed Origins

The list of allowed origins restricts which requests are accepted based on the requestor's origin.

Inclusion of the wildcard origin __'*'__ causes Gling to accept __any__ request coming in. This is included for local development only, and should not be used in production scenarios. Inclusion of the wildcard with other specific origins allows any origin. It is best practice to have the wildcard as the sole item in the origin list and in local development only. **For production, always use specifically named origin exclusively, with no wildcard**.

 [Same Origin policies](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) are important and you should familiarize yourself with them for production deployments.


#### Example Configuration

``` javascript
'user strict';
var ChangeType = require('gling').ChangeType;

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

> See _demo/server.js_ for an example. 

Import the required libraries, and any others you may wish.
``` javascript
"use strict";

const config = require('./config');

const Gling = require('gling').Gling;
const ClientManager = require('gling').ClientManager;
const http = require('http');
const WebSocketServer = require('websocket').server;
```

Set up the HTTP server, and the web socket
``` javascript

// set up websocket
var server = http.createServer((request, response) => {
    response.end('OK');
});

server.listen(8080, function (s) {
    console.log('Server is listening on port 8080');
});

var webSocketServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
```
Create a client manager using the configuration. Wire up the incoming Websocket requests to the client manager. The 

> ClientManager routes notifications to registered clients by the `topic` in the listener definition. This means that clients should open a socket for a specific `topic` and that topic should match one of the configured ones.

``` javascript
var clientManager = new ClientManager(config);

webSocketServer.on('request', (request) => {
    const origin = (request.origin || request.host);
    if (!ClientManager.isOriginAllowed(origin, config.allowedOrigins)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(`Rejected  ${(request.origin || request.host)}` );
        return;
    }

    var { topic, connection } = clientManager.registerClientConnection(request);

    console.log(`Got request from ${connection.remoteAddress} for topic "${topic}".`);
});
```

Prepare a hook for Gling to emit notifications into. The hook takes a topic name and payload. If you wish to transform or enrich the payload, this would be the place.
``` javascript
var hook = (topic, payload) => {
    console.log(`Broadcasting to clients of ${topic}`, payload);
    // payload.quoteOfTheDay = randomQuote.next();
    clientManager.broadcast(topic, payload);
}

```

Finally, create a Gling instance, and wire it up to the `hook` we just defined.

> You can call `gling.start(clientManager.broadcast)` directly if you don't need any custom action in the hook function.  

``` javascript
var gling = new Gling(config);

gling.start(hook)
    .then(() => console.log('started..'))
    .catch(reason => {
        console.error(reason);
    });

```



## Important Notes
This project aims to simplify hooking up document changes to real time notification. Notification delivery is not guaranteed in any way, and is done on a least-effort basis. Specifically: 
- Notifications are not stored or buffered.
- No resume-ability exists. If the server dies, then re-started, notifications will start flowing from the roughly the restart time.
- No attempt for retry delivery via WebSocket to clients.

> This fits with the intent of this project to provide a simple and lightweight way to liven up website pages. If you need a higher guarantee of delivery, please consider a custom or alternate project.

For production deployments, please consider [MongoDB Recommendations for Production](https://docs.mongodb.com/manual/administration/change-streams-production-recommendations/)
## Requirements
MongoDb 3.6 or above is required. MongoDB must be running a replica set. (Even if you have a standalone server, you can run it in replica set mode).


> This is an early-stage project. It has been developed against Node V8.8.1.

 
