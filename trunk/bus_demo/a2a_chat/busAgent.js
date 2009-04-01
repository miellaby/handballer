// library "Bus Agent" :
// A Bus Agent is a Pub/Sub Agent distributed over the web thanks to Handballer HTTP Bus.
// - If it is "here", you may directly set its attributs
// - It it is "there", you may set a value by pass it through the bus
// - It also may be "both" here and there!
// =========================================================================

function BusAgent(autobus, name, here) {
  (name.length > 0);
  PubSubAgent.call(this);
  this.autobus = autobus;
  this.name = name;
  this.location = (here === undefined ? BusAgent.prototype.there : here);
  this.autobus.tagsonomy.push("agent", this);
  if (this.here())
    this.autobus.tagsonomy.push("here", this);
  this.autobus.tagsonomy.push(name, this);
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;
BusAgent.prototype.here = 1;
BusAgent.prototype.there = 2;
BusAgent.prototype.both = 3;

PubSubAgent.prototype.privates = { privates: true, cbList: true, autobus: true, name: true, location: true, both: true } ;

BusAgent.prototype.here = function() {
   return this.location !== BusAgent.prototype.there;
}

BusAgent.prototype.there = function() {
   return this.location !== BusAgent.prototype.here;
}

BusAgent.prototype.setted = function(variable, value) {
  var oldValue = this[variable]; // to trace change in particular cases

  PubSubAgent.prototype.setted.call(this, variable, value);      

  value = this[variable]; // it may have change

  if (value == oldValue) return;

  if (variable == "name") {
       if (oldValue) this.autobus.tagsonomy.remove(oldValue, this);
       
       if (value)
         this.autobus.tagsonomy.push(value, this);
       else if (this.here() && oldValue) {
          this.autobus.hbc.send("freed/" + oldValue);
          return;
       }

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
  if (this.here() && name)
     this.autobus.hbc.send("model/" + name + "/" + variable, jsonize(value));
}

BusAgent.prototype.set = function(variable, value) {
   if (this.here()) {
       this.setted(variable, value);
   } else {
       this.autobus.hbc.send("control/" + this.name + "/set/" + variable, jsonize(value));
   }
}

BusAgent.prototype.call = function(fnName) {
   if (this.here()) {
       this[fnName].apply(this, arguments.splice(1));
   } else {
       this.autobus.hbc.send("control/" + this.name + "/" + fnName, jsonize(arguments.splice(1)));
   }
}

BusAgent.prototype.setTags = function() {
   this.set("tags", arguments);
}

BusAgent.prototype.forget = function() {
   for (i = 0, l = this.tags.length; i < l; i++) {
      this.autobus.tagsonomy.remove(this.tags[i], this);
   }
   this.tags=[];
   this.setted("name", undefined);
   this.unsubscribe();
}

BusAgent.prototype.status = function() {

  if (this.here()) {
    var pic = {};  
    for (p in this) {
      if (typeof this[p] == "function") continue;
      if (this.privates[p]) continue;
      pic[p] = this[p];
      this.autobus.hbc.send("model/" + this.name + "/" + p, jsonize(pic[p]));
    }
    return pic;

  } else {
    this.autobus.hbc.send("control/" + this.name + "/status", jsonize(value));
    return null;
  }
}


function busAgentUUID(prefix) {
  return prefix + Math.random().toString().substring(2);
}
