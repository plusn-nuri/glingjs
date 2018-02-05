var ChangeType;
(function (changeType) {
    changeType["create"] = "create";
    changeType["update"] = "update";
    changeType["remove"] = "remove";
})(ChangeType || (ChangeType = {}));

module.exports = ChangeType;