// Library "PubSub Agent"
//
// A pub/sub agent is an object whose public attributs must be handled
// through the get, set or splice accessors.
//
// In counter-part, public attributes can be individually subscribed by
// those which want to be notified of their changes.
//
// PubSubStates make the building of a loosely coupled Model/View layered
// software architecture much simpler.
// =========================================================================

function PubSubState(name, tagsonomy) {
  this.cbList = {};
  this.tagsonomy = tagsonomy;

  if (name)
    this.setted("name", name);

  if (tagsonomy) {
    tagsonomy.pushIn("agent", this);
  }
};

PubSubState.prototype.subscribe = function (attribut, cb) {
  if (this.cbList[attribut])
    this.cbList[attribut].push(cb);
  else
    this.cbList[attribut] = [cb];

  // this method return a convenient object for the caller to log every subscription
  // this can be used to log and clean a set of temporary subscriptions
  return { agent: this, attribut: attribut, cb: cb };
}

PubSubState.prototype.subscribeSync = function (attribut, cb) {
  var result = this.subscribe(attribut, cb);
  var value = this[attribut];
  if (value !== undefined) {
    if (typeof value == "object" && value.constructor == Array) {
      cb.apply(this, [attribut, 0, 0].concat(value)); // invoke callback in list mode
    } else
      cb.call(this, attribut, value); // invoke callback once
  }
  return result;
}

PubSubState.prototype.unsubscribe = function (attribute, cb) {
  if (!attribute) {
    Object.keys(this.cbList).forEach(a => {
      this.unsubscribe(a, cb);
    });
    return;
  }

  const t = this.cbList[attribute] || [];
  this.cbList[attribute] = t.filter(e => cb && e !== cb);
}

PubSubState.prototype.set_and_fire = function (attribut, value) {
  var oldValue = this[attribut]; // to trace change

  this[attribut] = value;

  if (!this.cbList[attribut])
    this.cbList[attribut] = []; // as a side effect, it marks this attribut as public

  for (var i = 0, lst = this.cbList[attribut], cb; cb = lst[i++];)
    cb.call(this, attribut, value); // invoke callbacks

  value = this[attribut]; // may have changed again

  if (!this.tagsonomy) return value;

  // special attributs related to tagsonomy

  if (attribut == "name" && oldValue != value) {
    if (oldValue) {
      this.tagsonomy.set(oldValue, undefined); // current key removed
      if (!value) this.setTags(); // no new key ==> forgotten objected
    }
    if (value) this.tagsonomy.set(value, this); // name = key
  }

  if (attribut == "tags") {
    var i, l;
    if (!oldValue) oldValue = [];
    for (i = 0, l = oldValue.length; i < l; i++) {
      var v = oldValue[i];
      if (value.indexOf(v) == -1)
        this.tagsonomy.removeIn(v, this);
    }
    for (i = 0, l = value.length; i < l; i++) {
      var v = value[i];
      if (oldValue.indexOf(v) == -1)
        this.tagsonomy.pushIn(v, this);
    }
  }

  return this[attribut];
}

PubSubState.prototype.get = function (attribut) { return this[attribut]; };

PubSubState.prototype.getOr = function (attribut, defaultValue) { return (this[attribut] === undefined ? defaultValue : this[attribut]); };

PubSubState.prototype.setted = function (attribut, newValue) {
  if (newValue == this[attribut])
    return newValue;

  return this.set_and_fire(attribut, newValue);
}

PubSubState.prototype.spliceIn = function (attribut, index, howMany /*, args ... */) {
  if (!this.cbList[attribut])
    this.cbList[attribut] = []; // as a side effect, it marks this attribut as public

  if (this[attribut] === undefined) this[attribut] = [];

  var array = this[attribut];
  var args = Array.prototype.slice.call(arguments, 1);

  // callbacks called before
  for (var i = 0, lst = this.cbList[attribut], cb; cb = lst[i++];)
    cb.apply(this, arguments); // invoke callbacks (in splice mode)

  var result = array.splice.apply(array, args);

  if (attribut == "tags") { // special tagsonomy values
    var i, l;
    for (i = 0, l = result.length; i < l; i++) {
      var v = result[i];
      this.tagsonomy.removeIn(v, this);
    }
    for (i = 2, l = args.length; i < l; i++) {
      var v = args[i];
      this.tagsonomy.pushIn(v, this);
    }
  }

  return result;
}

PubSubState.prototype.pushIn = function (attribut /*, ... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  this.spliceIn.apply(this, [attribut, this.getOr(attribut, []).length, 0].concat(args));
}

PubSubState.prototype.unshiftIn = function (attribut /*, ... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  this.spliceIn.apply(this, [attribut, 0, 0].concat(args));
}

PubSubState.prototype.indexOfIn = function (attribut, object) {
  return (this[attribut] ? this[attribut].indexOf(object) : -1);
}

PubSubState.prototype.removeIn = function (attribut, object) {
  var i = this.indexOfIn(attribut, object);
  while (i !== -1) {
    this.spliceIn(attribut, i, 1);
    i = this[attribut].indexOf(object, i);
  }
}

PubSubState.prototype.set = PubSubState.prototype.setted;


PubSubState.prototype.setTags = function () {
  //var args = Array.prototype.slice.call(arguments);
  //this.spliceIn.apply(this, ["tags", 0, this.getOr("tags", []).length].concat(args));
  this.setted("tags", Array.prototype.slice.call(arguments));
}

PubSubState.prototype.forget = function () {
  if (this.here())
    this.set("name", undefined);
  else
    this.setted("name", undefined);
  this.unsubscribe();
}

PubSubState.prototype.status = function () {
  var pic = {};
  for (var p in this) {
    if (typeof this[p] == "function" || !this.cbList[p]) continue;
    pic[p] = this[p];
  }
  return pic;
}


function agentUUID(prefix) {
  return prefix + Math.random().toString().substring(2);
}
