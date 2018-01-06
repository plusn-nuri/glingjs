"use strict";

var Config = require("../../src/app/config");

describe("Config", ()=>{
    it("Has connection string",()=>{
        expect(Config.connection).toBeDefined();
    })
    it("Has listener array",()=>{
        expect(Config.listeners[0]).toBeDefined();
    })
})