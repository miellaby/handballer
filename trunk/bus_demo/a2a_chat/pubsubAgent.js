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

// occurences removal helper
if (Array.prototype.remove === undefined) {
   Array.prototype.remove = function(s){
      var i = this.indexOf(s);
      while (i != -1) {
         this.splice(i, 1);
         i = this.indexOf(s,i);
      }
   }
}

function PubSubAgent() {
  this.cbList = {};
};

PubSubAgent.prototype.privates = { privates: true, cbList: true } ;

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
  this[variable] = value;

  if (this.cbList[variable])
    for (var lst = this.cbList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](this, variable, value);
}

PubSubAgent.prototype.get = function(variable) { return this[variable]; };

PubSubAgent.prototype.getOr = function(variable, defaultValue) { return (this[variable] == undefined ? defaultValue : this[variable]); };

PubSubAgent.prototype.setted = function(variable, newValue) {
  var currentValue = (this[variable] !== undefined ? this[variable] : null); 
  if (newValue != currentValue)
    this.set_and_fire(variable, newValue);
}

PubSubAgent.prototype.set = PubSubAgent.prototype.setted;

PubSubAgent.prototype.status = function() {
  var pic = {};
  for (p in this) {
    if (typeof this[p] == "function") continue;
    if (this.privates[p]) continue;
    pic[p] = this[p];
  }
  return pic;
}
