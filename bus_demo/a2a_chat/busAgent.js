// =========================================================================
// BusAgent : Bus Agent prototype
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

var busAgents = [];

function BusAgent() {
  this.cbList = {};
  this.cbListLong = {};
  this.here = false;
  busAgents.push(this);
};

BusAgent.prototype.subscribe = function (variable, cb) {
  if (this.cbList[variable])
    this.cbList[variable].push(cb);
  else
    this.cbList[variable] = [cb];
}

BusAgent.prototype.longSubscribe = function (variable, cb) {
  if (this.cbListLong[variable])
    this.cbListLong[variable].push(cb);
  else
    this.cbListLong[variable] = [cb];
}

BusAgent.prototype.longUnsubscribe = function(variable, cb) {
  this.cbListLong[variable].remove(cb);
}

BusAgent.prototype.set_and_fire = function(variable, value) {
  this[variable] = value;

  if (this.cbList[variable])
    for (var lst = this.cbList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, value);

  if (this.cbListLong[variable])
    for (var lst = this.cbListLong[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, value);
}

BusAgent.prototype.get = function(variable) { return this[variable]; };

BusAgent.prototype.getOr = function(variable, defaultValue) { return (this[variable] == undefined ? defaultValue : this[variable]); };

BusAgent.prototype.setted = function(variable, newValue) {
  var currentValue = (this[variable] != undefined ? this[variable] : null); 
  if (newValue != currentValue)
    this.set_and_fire(variable, newValue);
}

BusAgent.prototype.set = function(variable, newValue) {
   if (this.here) {
       return this.setted(variable, newValue);
   } else {
       hbc.send(
   }
}

BusAgent.prototype.status = function() {
  var status = new Object();
  for (p in this)
    if (p != "cbList" && p != "cbListLong")
       status[p] = this[p];
  return status;
}

function busAgentUnsubscribeAll() {
  for (var lst = busAgents, l = lst.length, i = l - 1; i >= 0; i--)
    lst[i].cbList = {};
}
