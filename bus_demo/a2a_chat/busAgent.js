// library "Bus Agent" :
// A Bus Agent is a Pub/Sub Agent distributed over the web thanks to Handballer HTTP Bus.
// - If it is "here", you may directly set its attributs
// - It it is "there", you may set a value by pass it through the bus
// - It also may be "both" here and there!
// =========================================================================

function BusAgent(autobus, name, here) {
  PubSubAgent.call(this);
  this.autobus = autobus;
  this.name = name;
  this.location = (here === undefined ? BusAgent.prototype.there : here);
  this.autobus.tagsonomy.push("agents", this);
  this.autobus.tagsonomy.push(name, this);
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;
BusAgent.prototype.here = 1;
BusAgent.prototype.there = 2;
BusAgent.prototype.both = 3;

BusAgent.prototype.setted = function(variable, value) {
  var oldValue = this[variable]; // to trace change in particular cases

  PubSubAgent.prototype.setted.call(this, variable, value);      

  value = this[variable]; // it may have change

  if (value == oldValue) return;

  if (variable == "name") {
       if (oldValue) this.autobus.tagsonomy.remove(oldValue, this);
       this.autobus.tagsonomy.add(oldValue, this);

  } else if (variable == "tags") {
       var i, l;
       if (!oldValue) oldValue = [];
       for (i = 0, l = oldValue.length; i < l; i++) {
          var v = oldValue[i];
          if (value.indexOf(v) == -1)
             this.autobus.tagsonomy.remove(v, this);
       }
       for (i = 0, l = value.length; i < l; i++) {
          var v = value[i];
          if (oldValue.indexOf(v) == -1)
             this.autobus.tagsonomy.push(v, this);
       }
  }

  var name = (variable == "name" ? oldValue : this.name);
  if (this.location !== BusAgent.prototype.there && name)
     this.autobus.hbc.send("model/" + name + "/" + variable, jsonize(value));
}

BusAgent.prototype.set = function(variable, value) {
   if (this.location !== BusAgent.prototype.there) {
       this.setted(variable, value);
   } else {
       this.autobus.hbc.send("control/" + this.name + "/set/" + variable, jsonize(value));
   }
}

BusAgent.prototype.call = function(fnName) {
   if (this.location !== BusAgent.prototype.there) {
       this[fnName].apply(this, arguments.splice(1));
   } else {
       this.autobus.hbc.send("control/" + this.name + "/" + fnName, jsonize(arguments.splice(1)));
   }
}

BusAgent.prototype.setTags = function() {
   this.set("tags", arguments);
}

BusAgent.prototype.forget = function() {
   this.set("tags", []);
   this.set("name", undefined);
}

function busAgentUUID(prefix) {
  return prefix + Math.random().toString().substring(2);
}
