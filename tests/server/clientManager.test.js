"use strict";

const ClientManager = require("../../src/clientManager");

describe("ClientManager", () => {
    var config = {
        listeners: [{ topic: 'test-topic' }, { topic: 'another-topic' }]
    }

    describe("createTopicMap", () => {
        it("Adds topics from config", () => {
            var actual = ClientManager.createTopicMap(config);
            expect(Object.keys(actual).length).toBe(config.listeners.length);
        })
    })
    describe("removeConnection", () => {
        it("Removes connection instance", () => {
            var subject = { tag: 'demo' };
            const map = { 'test-topic': [subject] };

            expect(map['test-topic'].find((e) => e == subject)).not.toBe(undefined);

            // act
            ClientManager.removeConnection(subject, 'test-topic', map);
            
            expect(map['test-topic'].find((e) => e == subject)).toBe(undefined);
        })
    })

    describe("broadcast", () => {
        it("Calls sendUTF on open connections", () => {
            var target = new ClientManager(config)
            var subject = { received: null, sendUTF: function (d) { this.received = d }, connected: true };

            target.clientTopicMap['test-topic'].push(subject);

            target.broadcast('test-topic', 'hello');

            expect(subject.received).toBe("hello");
        })
        it("Doesn't call sendUTF on closed connections", () => {
            var target = new ClientManager(config)
            var subject = { received: null, sendUTF: function (d) { this.received = d }, connected: false };

            target.clientTopicMap['test-topic'].push(subject);

            target.broadcast('test-topic', 'hello');

            expect(subject.received).toBe(null);
        })
    })
})