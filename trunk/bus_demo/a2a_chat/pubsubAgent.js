// Library "PubSub Agent"
//
// A pub/sub agent is an object whose attributs must be preferably handled through
// get/set accessors.
//
// The counter-part is that all attributes are individually subscribable by upper-layer
// objects which want to be notified of changes within the object.
//
// PubSubAgents make the building of a loosely coupled Model/View layered
// software architecture much simpler.
// =========================================================================

function PubSubAgent(tagsonomy) {
  this.cbList = {};
  this.tagsonomy = tagsonomy;
  if (tagsonomy)
    tagsonomy.push("agent", this);
};

PubSubAgent.prototype.privates = { privates: true, cbList: true, tagsonomy: true } ;

PubSubAgent.prototype.subscribe = function (variable, cb) {
  if (this.cbList[variable])
    this.cbList[variable].push(cb);
  else
    this.cbList[variable] = [cb];

  // this method return a convenient object for the caller to log every subscription
  // this can be used to log and clean a set of temporary subscriptions
  return { agent: this, variable: variable, cb: cb };
}

PubSubAgent.prototype.unsubscribe = function(variable, cb) {
  if (!variable) {
     if (!cb) {
        this.cbList = {};
     } else {
        for (variable in this.cbList)
           this.cbList[variable].remove(cb);
     }
     return;
  }

  if (cb)
     this.cbList[variable].remove(cb);
   else
     this.cbList[variable] = [];
}

PubSubAgent.prototype.set_and_fire = function(variable, value) {
  var oldValue = this[variable]; // to trace change

  this[variable] = value;
  if (this.cbList[variable])
    for (var lst = this.cbList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](this, variable, value);

  value = this[variable]; // may have changed again

  if (!this.tagsonomy) return value;

  if (variable == "name" && oldValue != value) {
    if (oldValue) this.tagsonomy.remove(oldValue, this);
    if (value)    this.tagsonomy.push(value, this);
  }

  if (variable == "tags") {
    var i, l;
    if (!oldValue) oldValue = [];
    for (i = 0, l = oldValue.length; i < l; i++) {
       var v = oldValue[i];
       if (value.indexOf(v) == -1)
          this.tagsonomy.remove(v, this);
    }
    for (i = 0, l = value.length; i < l; i++) {
       var v = value[i];
       if (oldValue.indexOf(v) == -1)
          this.tagsonomy.push(v, this);
    }
  }

  return this[variable];
}

PubSubAgent.prototype.get = function(variable) { return this[variable]; };

PubSubAgent.prototype.getOr = function(variable, defaultValue) { return (this[variable] == undefined ? defaultValue : this[variable]); };

PubSubAgent.prototype.setted = function(variable, newValue) {
  var currentValue = (this[variable] !== undefined ? this[variable] : null); 

  if (newValue == currentValue)
    return newValue;

  return this.set_and_fire(variable, newValue);
}

PubSubAgent.prototype.set = PubSubAgent.prototype.setted;


PubSubAgent.prototype.setTags = function() {
   this.set("tags", arguments);
}

PubSubAgent.prototype.forget = function() {
   if (this.tags) {
     for (i = 0, l = this.tags.length; i < l; i++) {
       this.tagsonomy.remove(this.tags[i], this);
     }
     this.tags = [];
   }

   if (this.name)
      this.setted("name", undefined);

   this.unsubscribe();
}

PubSubAgent.prototype.status = function() {
  var pic = {};
  for (p in this) {
    if (typeof this[p] == "function") continue;
    if (this.privates[p]) continue;
    pic[p] = this[p];
  }
  return pic;
}
