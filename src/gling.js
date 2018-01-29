'use strict';

var ChangeType = require('./changeType');
var MongoClient = require('mongodb').MongoClient;

var Gling = function Gling(config) {
    this.config = config;
    this.subscriptions = [];

    this.config.listeners.forEach(listener => {
        // target collection 
        var subscription = {
            collection: listener.collection,
            topic: listener.topic,
        };

        // which change types
        subscription.pipeline = [this.createOpTypeFilter(listener)];

        // document filter if any
        var documentFilter = this.createDocumentFilter(listener);
        if (documentFilter) { subscription.pipeline.push(documentFilter); }

        // projection if any
        var projection = this.createProjection(listener);
        if (projection) subscription.pipeline.push(projection);

        // options
        subscription.options = this.createOptions(listener);

        // register this subscription
        this.subscriptions.push(subscription);
    });

    this.start = function (hook) {
        const connection = process.env.MONGODB_CONNECTION || this.config.connection;

        const dbName = connection.match(/\/\/.+\/([^/?]+)/)[1];

        return MongoClient
            .connect(connection)
            .then(client => {
                this.subscriptions.forEach(sub =>
                    createChangeStreamListener(client.db(dbName), sub, hook));
            })
    }

    var createChangeStreamListener = function (db, subscription, hook) {
        var that = this;
        var collection = db.collection(subscription.collection);
        console.log(JSON.stringify(subscription));

        var changeStream = collection.watch(subscription.pipeline, subscription.options);

        changeStream.on('change', data => {
            hook(subscription.topic, Gling.prototype.getEventPayload(data));
        });

        changeStream.on('open', () => console.log('Opened ', subscription.collectionName, subscription.when));
        changeStream.on('end', () => console.log('Ended ', subscription.collectionName, subscription.when));
        changeStream.on('error', err => {
            throw err
        });

        return changeStream;
    }
}



Gling.prototype.createDocumentFilter = function (definition) {
    if (definition.filter) {
        return { $match: Gling.prototype.ensureDocumentFilterFieldNaming(definition.filter) }
    }
    return undefined;
}

Gling.prototype.ensureDocumentFilterFieldNaming = function (filter) {
    var result = {};

    for (var key in filter) {
        var newKey;
        var value = filter[key];
        if (key.isOperatorName()) {
            newKey = key;
            value = filter[key].map(entry => Gling.prototype.ensureDocumentFilterFieldNaming(entry))
        }
        else {
            var newKey = Gling.prototype.fixKeyName(key)
            result[newKey] = filter[key];
        }
        result[newKey] = value;
    }

    return result
}

Gling.prototype.createProjection = function (definition) {
    if (definition.fields && Array.isArray(definition.fields)) {
        var result = {}
        definition.fields.forEach(field => { result[Gling.prototype.fixKeyName(field)] = 1 })
        return { $project: result };
    }
    return undefined;
}

Gling.prototype.createOpTypeFilter = function (definition) {
    var result = { $match: { operationType: { $in: [] } } };
    definition.when.forEach(entry => {
        if (entry == ChangeType.create) { result.$match.operationType.$in.push('insert') }
        if (entry == ChangeType.update) {
            result.$match.operationType.$in.push('update', 'replace');
        }
        if (entry == ChangeType.remove) {
            result.$match = { operationType: 'delete' }
        }
    })
    return result;
}

Gling.prototype.createOptions = function (definition) {
    return {
        fullDocument: definition.fields ? 'updateLookup' : 'default'
    };
}

Gling.prototype.fixKeyName = function (key) {
    if (key.isOperatorName()) { return key; }
    if (key.isFullDocumentPrefixed()) { return key; }
    return 'fullDocument.' + key;
}

Gling.prototype.getEventPayload = function (change) {
    return (change.fullDocument) ? change.fullDocument : change.documentKey;
}

String.prototype.isOperatorName = function () { return this.charAt(0) === '$'; }
String.prototype.isFullDocumentPrefixed = function () { return this.slice(0, 13) === 'fullDocument.'; }
String.prototype.isOriginAllowed = function (allowedOrigins) {
    var canonicalOrigin = this.toLowerCase();
    if (!allowedOrigins || !Array.isArray(allowedOrigins)) { return false; }
    
    return allowedOrigins.some(e =>
        (e === '*' || e.toLowerCase() === this));
}

module.exports = Gling;


