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

function PubSubState(name, tagsonomy, index) {
  this.cbList = {};
  if (tagsonomy) this.tagsonomy = tagsonomy;
  if (index) this.index = index;

  if (name)
    this.setted("name", name);

  if (tagsonomy) {
    tagsonomy.pushIn("state", this);
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
  let result = this.subscribe(attribut, cb);
  let value = this[attribut];
  if (value !== undefined) {
    if (typeof value === "object" && value.constructor === Array)
      cb.apply(this, [attribut, 0, 0].concat(value)); // invoke callback in list mode
    else
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

PubSubState.prototype.set_and_fire = function (attribute, value) {
  let oldValue = this[attribute]; // to trace change

  this[attribute] = value;

  if (!this.cbList[attribute])
    this.cbList[attribute] = []; // as a side effect, it marks this attribut as public

  let arrayMode = (typeof value === "object" && value.constructor === Array);
  this.cbList[attribute].forEach(cb => {
    if (arrayMode)
      cb.apply(this, [attribute, 0, 0].concat(value)); // invoke callback in list mode
    else
      cb.call(this, attribute, value); // invoke callback once
  });

  value = this[attribute]; // may have changed again

  // index
  if (attribute === "name" && this.index && oldValue !== value) {
    if (oldValue) {
      this.index.set(oldValue, undefined); // current key removed
      if (!value) this.setTags(); // no new key ==> forgotten objected
    }
    if (value)
      this.index.set(value, this);
  }

  // tagsonomy
  if (attribute === "tags" && this.tagsonomy) {
    oldValue = oldValue || [];
    oldValue.filter(t => !~value.indexOf(t)).forEach(t => this.tagsonomy.removeIn(t, this));
    value.filter(t => !~oldValue.indexOf(t)).forEach(t => this.tagsonomy.pushIn(t, this));
  }

  return this[attribute];
}

PubSubState.prototype.get = function (attribut) { return this[attribut]; };

PubSubState.prototype.getOr = function (attribut, defaultValue) { return (this[attribut] === undefined ? defaultValue : this[attribut]); };

PubSubState.prototype.setted = function (attribut, newValue) {
  if (typeof newValue !== "object" && newValue === this[attribut])
    return newValue;

  return this.set_and_fire(attribut, newValue);
}

PubSubState.prototype.spliceIn = function (attribute, index, howMany /*, args ... */) {
  if (!this.cbList[attribute])
    this.cbList[attribute] = [];
    // side effect: attribute goes public
 
  if (!this[attribute])
    this[attribute] = [];


  // invoke callbacks (in splice mode) before action
  this.cbList[attribute].forEach(cb => cb.apply(this, arguments));


  let array = this[attribute];
  let args = Array.prototype.slice.call(arguments, 1);
  let removed = array.splice.apply(array, args);

  if (attribute === "tags") { // special tagsonomy values
    removed.forEach(v => this.tagsonomy.removeIn(v, this));
    args.shift(); args.shift();
    args.forEach(v => this.tagsonomy.pushIn(v, this));
  }

  return removed;
}

PubSubState.prototype.pushIn = function (attribute /*, ... */) {
  let args = Array.prototype.slice.call(arguments, 1);
  this.spliceIn.apply(this, [attribute, this.getOr(attribute, []).length, 0].concat(args));
}

PubSubState.prototype.unshiftIn = function (attribute /*, ... */) {
  let args = Array.prototype.slice.call(arguments, 1);
  this.spliceIn.apply(this, [attribute, 0, 0].concat(args));
}

PubSubState.prototype.indexOfIn = function (attribute, object) {
  return (this[attribute] ? this[attribute].indexOf(object) : -1);
}

PubSubState.prototype.removeIn = function (attribute, object) {
  let i = this.indexOfIn(attribute, object);
  while (i !== -1) {
    this.spliceIn(attribute, i, 1);
    i = this[attribute].indexOf(object, i);
  }
}

PubSubState.prototype.set = PubSubState.prototype.setted;


PubSubState.prototype.setTags = function () {
  //var args = Array.prototype.slice.call(arguments);
  //this.spliceIn.apply(this, ["tags", 0, this.getOr("tags", []).length].concat(args));
  this.set("tags", Array.prototype.slice.call(arguments));
}

PubSubState.prototype.forget = function () {
  if (this.here())
    this.set("name", undefined);
  else
    this.setted("name", undefined);
  this.unsubscribe();
}

PubSubState.prototype.status = function () {
  let pic = {};
  for (let p in this) {
    if (typeof this[p] === "function" || !this.cbList[p]) continue;
    pic[p] = this[p];
  }
  return pic;
}


function stateUUID(prefix) {
  return prefix + Math.random().toString().substring(2);
}
