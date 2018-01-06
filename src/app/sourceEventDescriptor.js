function sourceEventDescriptor(collection, changeType, returnSchema){
    this.collection = collection;
    this.changeType = changeType;
    this.returnSchema = returnSchema;
}

module.exports = sourceEventDescriptor
