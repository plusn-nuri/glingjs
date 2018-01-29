'user strict';
var ChangeType = require('../src/changeType');

const Config = {
    connection: 'mongodb://localhost:27017/gling?replSet=r1',
    allowedOrigins: ['http://localhost:8080/gling', '*'],
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
            fields: ['url', 'caption'],
            topic: 'meme-cat'
        }
    ]
}

module.exports = Config;