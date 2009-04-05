// library "Bus Agent" :
// A Bus Agent is a Pub/Sub Agent distributed over the web thanks to Handballer HTTP Bus.
// - If it is "here", you may directly set its attributs
// - It it is "there", you may set a value by pass it through the bus
// - It also may be "both" here and there!
// =========================================================================

function BusAgent(autobus, name, here) {
  (name.length > 0);
  this.autobus = autobus;
  PubSubAgent.call(this, autobus.tagsonomy);
  this.location = (here === undefined ? BusAgent.prototype.there : here);
  this.setted("name", name);
  if (this.here())
    this.tagsonomy.push("here", this);
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;
BusAgent.prototype.here = 1;
BusAgent.prototype.there = 2;
BusAgent.prototype.both = 3;

PubSubAgent.prototype.privates = { privates: true, cbList: true, tagsonomy: true, autobus: true, name: true, location: true, both: true } ;

BusAgent.prototype.here = function() {
   return this.location !== BusAgent.prototype.there;
}

BusAgent.prototype.there = function() {
   return this.location !== BusAgent.prototype.here;
}

BusAgent.prototype.setted = function(variable, newValue) {
  var currentValue = (this[variable] !== undefined ? this[variable] : null); 

  if (newValue == currentValue)
    return newValue;

  newValue = this.set_and_fire(variable, newValue);
  // note value may have changed

  if (this.here()) {
    if (variable == "name") {
      if (currentValue) {
        if (!newValue) {
          this.autobus.hbc.send("freed/" + currentValue);
        } else {
          this.autobus.hbc.send("model/" + currentValue + "/name", jsonize(newValue));
        }
      }
    } else {
      this.autobus.hbc.send("model/" + this.name + "/" + variable, jsonize(newValue));
    }
  }

  return newValue;
}

BusAgent.prototype.setteds = function(deltaObj) {
  var name = this.name;

  var deltaObj2 = {};
  for (variable in deltaObj) {
    var newValue = deltaObj[variable];
    var currentValue = (this[variable] !== undefined ? this[variable] : null); 

    if (newValue == currentValue) continue;

    newValue = this.set_and_fire(variable, newValue);

    if (newValue != currentValue)
     deltaObj2[variable] = newValue;
  }

  if (!name) name = this.name;

  if (this.here() && name)
    this.autobus.hbc.send("model/" + name, jsonize(deltaObj2));
}

BusAgent.prototype.set = function(variable, value) {
   if (this.here()) {
       this.setted(variable, value);
   } else {
       this.autobus.hbc.send("control/" + this.name + "/set/" + variable, jsonize(value));
   }
}

BusAgent.prototype.sets = function(deltaObj) {
   if (this.here()) {
       this.setteds(deltaObj);
   } else {
       this.autobus.hbc.send("control/" + this.name + "/set", jsonize(deltaObj));
   }
}

BusAgent.prototype.call = function(fnName) {
   if (this.here()) {
       this[fnName].apply(this, arguments.splice(1));
   } else {
       this.autobus.hbc.send("control/" + this.name + "/" + fnName, jsonize(arguments.splice(1)));
   }
}

BusAgent.prototype.status = function() {

  if (this.here()) {
    var pic = {};  
    for (p in this) {
      if (typeof this[p] == "function") continue;
      if (this.privates[p]) continue;
      pic[p] = this[p];
    }
    this.autobus.hbc.send("model/" + this.name, jsonize(pic));
    return pic;

  } else {
    this.autobus.hbc.send("control/" + this.name + "/status", jsonize(value));
    return null;
  }
}

function busAgentUUID(prefix) {
  return prefix + Math.random().toString().substring(2);
}
