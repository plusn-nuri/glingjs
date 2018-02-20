'use strict';

var ChangeType = require('./changeType');
var MongoClient = require('mongodb').MongoClient;
var ClientManager = require('./clientManager');
class Gling {

    constructor(config) {
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
    }
    start(hook) {
        const connection = process.env.MONGODB_CONNECTION || this.config.connection;

        const dbName = connection.match(/\/\/.+\/([^/?]+)/)[1];

        return MongoClient
            .connect(connection)
            .then(client => {
                this.subscriptions.forEach(sub =>
                    createChangeStreamListener(client.db(dbName), sub, hook));
            })
    }

    createChangeStreamListener(db, subscription, hook) {
        var that = this;
        var collection = db.collection(subscription.collection);
        console.log(JSON.stringify(subscription));

        var changeStream = collection.watch(subscription.pipeline, subscription.options);

        changeStream.on('change', data => {
            hook(subscription.topic, Gling.getEventPayload(data));
        });

        changeStream.on('open', () => console.log('Opened ', subscription.collectionName, subscription.when));
        changeStream.on('end', () => console.log('Ended ', subscription.collectionName, subscription.when));
        changeStream.on('error', err => {
            throw err
        });

        return changeStream;
    }




    static createDocumentFilter(definition) {
        if (definition.filter) {
            return { $match: Gling.ensureDocumentFilterFieldNaming(definition.filter) }
        }
        return undefined;
    }

    static ensureDocumentFilterFieldNaming(filter) {
        var result = {};

        for (var key in filter) {
            var newKey;
            var value = filter[key];
            if (this.isOperatorName(key)) {
                newKey = key;
                value = filter[key].map(entry => Gling.ensureDocumentFilterFieldNaming(entry))
            }
            else {
                var newKey = this.fixKeyName(key)
                result[newKey] = filter[key];
            }
            result[newKey] = value;
        }

        return result
    }

    static createProjection(definition) {
        if (definition.fields && Array.isArray(definition.fields)) {
            var result = {}
            definition.fields.forEach(field => { result[Gling.fixKeyName(field)] = 1 })
            return { $project: result };
        }
        return undefined;
    }

    static createOpTypeFilter(definition) {
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

    createOptions(definition) {
        return {
            fullDocument: definition.fields ? 'updateLookup' : 'default'
        };
    }

    static fixKeyName(key) {
        if (this.isOperatorName(key)) { return key; }
        if (this.isFullDocumentPrefixed(key)) { return key; }
        return 'fullDocument.' + key;
    }

    static getEventPayload(change) {
        return (change.fullDocument) ? change.fullDocument : change.documentKey;
    }
    static isOperatorName(str) { return str.charAt(0) === '$'; }

    static isFullDocumentPrefixed(str) { return str.slice(0, 13) === 'fullDocument.'; }

    static isOriginAllowed(origin, allowedOrigins) {
        var canonicalOrigin = origin.toLowerCase();
        if (!allowedOrigins || !Array.isArray(allowedOrigins)) { return false; }

        return allowedOrigins.some(e =>
            (e === '*' || e.toLowerCase() === canonicalOrigin));
    }
}

module.exports = Gling;


