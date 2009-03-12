// =========================================================================
// indexAgent: a pub/sub agent "class" managing subscribable indexes of objects
// =========================================================================

function IndexAgent() {
  PubSubAgent.call(this);
  this.cbPushList = {};
  this.cbRemoveList = {};
};

IndexAgent.prototype.push = function(name, object) {
  if (this[name] === undefined) this[name] = [];
  this[name].push(object);

  if (this.cbPushList[variable] !== undefined)
    for (var lst = this.cbPushList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, object);
}

IndexAgent.prototype.remove = function(name, object) {
  if (this[name] === undefined) return;
  this[name].remove(object);

  if (this.cbRemoveList[variable] !== undefined)
    for (var lst = this.cbRemoveList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, object);
}

IndexAgent.prototype.getIndex = function(name) {
  if (this[name] === undefined) this[name] = [];
  return this[name];
}

IndexAgent.prototype.isIndexed = function(name, object) {
  return (this[name] && this[name].indexOf(object) != -1);
}

IndexAgent.prototype.setSubscribe = function (variable, cbPush, cbRemove) {
  if (cbPush) {
     if (this.cbPushList[variable])
        this.cbPushList[variable].push(cbPush);
     else
       this.cbPushList[variable] = [cbPush];
  }

  if (cbRemove) {
     if (this.cbRemoveList[variable])
        this.cbRemoveList[variable].push(cbRemove);
     else
        this.cbRemoveList[variable] = [cbRemove];
  }
}

IndexAgent.prototype.setUnsubscribe = function (variable, cbPush, cbRemove) {
  if (cbPush) this.cbPushList[variable].remove(cbPush);
  if (cbRemove) this.cbRemoveList[variable].remove(cbRemove);
}
