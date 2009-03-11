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
         i = this.indexOf(s);
      }
   }
}

var pubSubAgents = [];

function PubSubAgent() {
  this.cbList = {};
  this.cbListLong = {};
  pubSubAgents.push(this);
};

PubSubAgent.prototype.subscribe = function (variable, cb) {
  if (this.cbList[variable])
    this.cbList[variable].push(cb);
  else
    this.cbList[variable] = [cb];
}

PubSubAgent.prototype.longSubscribe = function (variable, cb) {
  if (this.cbListLong[variable])
    this.cbListLong[variable].push(cb);
  else
    this.cbListLong[variable] = [cb];
}

PubSubAgent.prototype.longUnsubscribe = function(variable, cb) {
  this.cbListLong[variable].remove(cb);
}

PubSubAgent.prototype.set_and_fire = function(variable, value) {
  this[variable] = value;

  if (this.cbList[variable])
    for (var lst = this.cbList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, value);

  if (this.cbListLong[variable])
    for (var lst = this.cbListLong[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, value);
}

PubSubAgent.prototype.get = function(variable) { return this[variable]; };

PubSubAgent.prototype.getOr = function(variable, defaultValue) { return (this[variable] == undefined ? defaultValue : this[variable]); };

PubSubAgent.prototype.setted = function(variable, newValue) {
  var currentValue = (this[variable] != undefined ? this[variable] : null); 
  if (newValue != currentValue)
    this.set_and_fire(variable, newValue);
}

PubSubAgent.prototype.set = PubSubAgent.prototype.setted;

PubSubAgent.prototype.status = function() {
  var status = new Object();
  for (p in this)
    if (p != "cbList" && p != "cbListLong")
       status[p] = this[p];
  return status;
}

function pubSubAgentUnsubscribeAll() {
  for (var lst = pubSubAgents, l = lst.length, i = l - 1; i >= 0; i--)
    lst[i].cbList = {};
}
