var changeType;
(function (changeType) {
    changeType[changeType["create"] = 0] = "create";
    changeType[changeType["update"] = 1] = "update";
    changeType[changeType["remove"] = 2] = "remove";
})(changeType || (changeType = {}));

module.exports = changeType;