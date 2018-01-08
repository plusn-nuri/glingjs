'user strict';
var ChangeType = require('../src/server/changeType');

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