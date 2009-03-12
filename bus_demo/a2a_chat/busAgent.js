// library "Bus Agent" :
// A Bus Agent is a Pub/Sub Agent distributed over the web thanks to Handballer HTTP Bus.
// If it is "here", you may directly set its attributs
// It it is "there", you may set a value by pass it through the bus
// =========================================================================

function BusAgent(autobus, name, here) {
  PubSubAgent.call(this);
  this.autobus = autobus;
  this.name = name;
  this.here = (here === undefined ? false : here);
  this.autobus.indexAgent.push("agents", this);
  this.autobus.indexAgent.push(name, this);
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;

BusAgent.prototype.setted = function(variable, value) {
  PubSubAgent.prototype.setted.call(this, variable, value);      
  value = this[variable]; // it may have change
  if (variable == "tags") {
        var i = 0, l = value.length;
        while (i < l) {
           this.autobus.indexAgent.push(value[i++], this);
        }
  }
  if (this.here)
    this.autobus.hbc.send("model/" + this.name + "/" + variable, jsonize(value));
}

BusAgent.prototype.set = function(variable, value) {
   if (this.here) {
       this.setted(variable, value);
   } else {
       this.autobus.hbc.send("control/" + this.name + "/set/" + variable, jsonize(value));
   }
}

BusAgent.prototype.call = function(fnName) {
   if (this.here) {
       this[fnName].apply(this, arguments);
   } else {
       this.autobus.hbc.send("control/" + this.name + "/" + fnName, jsonize(arguments));
   }
}

function busAgentUUID(prefix) {
  return prefix + Math.random().toString().substring(2);
}
