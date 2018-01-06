"use strict";
var ChangeType = require("./changeType");

var Gling = (function () {
    function Gling(config) {
        this.config = config;
        this.subscriptions = [];
    }

    Gling.prototype.createDocumentFilter = function (definition) {
        if (definition.filter) {
            return { $match: definition.filter }
        }
        return undefined;
    }

    Gling.prototype.ensureDocumentFilterFieldNaming = function (filter) {

        var result = {};
        filter.entries.forEach(entry=> {
            result['marklar_'+entry[0]] = entry[1];
        })

return result
    }

    Gling.prototype.createProjection = function (definition) {
        if (definition.fields && definition.fields[0]) {
            var result = {}
            definition.fields.forEach(f => { result[f] = 1 })
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

    return Gling;
}());

module.exports = Gling;