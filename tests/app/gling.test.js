"use strict";
var ChangeType = require("../../src/app/changeType");
var Gling = require("../../src/app/gling");

describe("Gling", () => {

    const sampleOptions1 = {
        collecton: 'users',
        when: [ChangeType.create],
        filter: { number: { $mod: [3, 2] } },
        fields: ['name'],
        topics: ['user-registered', 'new-user']
    };

    it("Creates empty subscriptions", () => {
        expect(instance().subscriptions).toEqual([]);
    })


    describe("createDocumentFilter", () => {
        it("returns undefined if no filter specified", () => {
            var actual = instance().createDocumentFilter({});

            expect(actual).toBe(undefined);
        })
        it("returns $match if  filter present", () => {
            var actual = instance().createDocumentFilter({ filter: sampleOptions1.filter });

            expect(actual.$match).toEqual(sampleOptions1.filter);
        })

    })

    describe("createProjection", () => {
        it("returns undefined if no fields specified", () => {
            var actual = instance().createProjection({ fields: null });

            expect(actual).toBe(undefined);
        })
        it("returns projected fields for fields specified", () => {
            var actual = instance().createProjection({ fields: ['alpha', 'beta.gamma', 'foo[2].id'] });

            expect(actual).toEqual({ $project: { 'alpha': 1, 'beta.gamma': 1, 'foo[2].id': 1 } });
        })
    })

    describe("createOpTypeFilter", () => {
        it("Adds match operatoinType insert for ChangeType.create", () => {
            var actual = instance().createOpTypeFilter({ when: [ChangeType.create] });

            expect(actual.$match).toEqual({ operationType: { $in: ['insert'] } });
        });
        it("Adds match operatoinType update or replace for ChangeType.update", () => {

            var actual = instance().createOpTypeFilter({ when: [ChangeType.update] });

            expect(actual.$match).toEqual({ operationType: { $in: ['update', 'replace'] } });
        });
        it("Adds match operatoinType delete  for ChangeType.remove", () => {

            var actual = instance().createOpTypeFilter({ when: [ChangeType.remove] });

            expect(actual.$match).toEqual({ operationType: 'delete' });
        });
    })
    describe("createOptions", () => {


        it("Sets 'fullDocument' to 'updateLookup' when fields present", () => {
            var actual = instance().createOptions(sampleOptions1);

            expect(actual.fullDocument).toBe('updateLookup');
        })
        it("Sets 'fullDocument' to 'default' when fields empty", () => {
            var sample = sampleOptions1;

            delete sample.fields;

            var actual = instance().createOptions(sample);

            expect(actual.fullDocument).toBe('default');
        })
    })

    describe("fix filter naming", () => {
        it("adds marklar", () => {
            var actual = instance().ensureDocumentFilterFieldNaming({ name: 'bob' });

            expect(actual.marklar_name).toBe('bob')
        })
    })
})

function instance() {
    return new Gling({});
}
