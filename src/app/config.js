'user strict';
var ChangeType = require('./changeType');

const Config = {
    connection: 'mongodb://localhost:27017/tadadu?replSet=r1',
    listeners: [
        {
            collecton: 'users',
            when: [ChangeType.create],
            filter: { name: 'bob', number: { $mod: [3, 2] } },
            fields: ['name'],
            topics: ['user-registered', 'new-user']
        }
    ]
}

module.exports = Config;