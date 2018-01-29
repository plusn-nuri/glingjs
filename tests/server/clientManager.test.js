"use strict";

const ClientManager = require("../../src/clientManager");

describe("ClientManager", () => {
    var config = {
        listeners: [{ topic: ['test-topic'] }, { topic: ['another-topic'] }]
    }

    describe("createTopicMap", () => {
        it("Adds topics from config", () => {
            var actual = (new ClientManager(config)).createTopicMap(config);
            expect(Object.keys(actual).length).toBe(2);
        })
    })
    describe("removeConnection", () => {
        it("Removes connection instance", () => {
            var target = new ClientManager(config)
            var subject = { tag: 'demo' };

            target.clientTopicMap['test-topic'].push(subject);

            expect(target.clientTopicMap['test-topic'].find((e) => e == subject)).not.toBe(undefined);

            target.removeConnection(subject, 'test-topic');
            expect(target.clientTopicMap['test-topic'].find((e) => e == subject)).toBe(undefined);
        })
    })

    describe("broadcast", () => {
        it("Calls sendUTF on open connections", () => {
            var target = new ClientManager(config)
            var subject = { received : null, sendUTF: function (d) { this.received = d } , connected: true};

            target.clientTopicMap['test-topic'].push(subject);

            target.broadcast('test-topic', 'hello');

            expect(subject.received).toBe("hello");
        })
        it("Doesn't call sendUTF on closed connections", () => {
            var target = new ClientManager(config)
            var subject = { received : null, sendUTF: function (d) { this.received = d } , connected: false};

            target.clientTopicMap['test-topic'].push(subject);

            target.broadcast('test-topic', 'hello');

            expect(subject.received).toBe(null);
        })
    })
})