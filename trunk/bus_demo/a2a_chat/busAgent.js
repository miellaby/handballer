// library "Bus Agent" :
// A Bus Agent is a Pub/Sub Agent distributed over the web thanks to HandBaller HTTP Bus
// and the "autobus" Javascript framework.
// - If it is "here", you may directly set its attributs
// - It it is "there", you may set a value via the bus
// - It also may be "both" mirrored here and there!
// =========================================================================

function BusAgent(autobus, name, location, recipient) {
  this.autobus = autobus;
  this.location = undefined;
  PubSubAgent.call(this, name, autobus ? autobus.tagsonomy : undefined);
  if (!autobus) return; // prototype case handling

  this.recipient = recipient ? (recipient.abccli || this.autobus.agora) : this.autobus.agora;

  if ((location === BusAgent.prototype.here || location === BusAgent.prototype.both) && autobus.agora)
      this.setted("abcli", autobus.hbc.token + autobus.hbc.clientId);

  this.location = (location === undefined ? BusAgent.prototype.there : location);

  if (this.here()) {
      if (this.tagsonomy && name)
          this.tagsonomy.pushIn("here", this);
      
      this.status();
  }
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;
BusAgent.prototype.here = 1;
BusAgent.prototype.there = 2;
BusAgent.prototype.both = 3;

BusAgent.prototype.here = function() {
   return this.location !== undefined && this.location !== BusAgent.prototype.there;
}

BusAgent.prototype.there = function() {
   return this.location !== BusAgent.prototype.here;
}

BusAgent.prototype.setted = function(variable, newValue) {
  var currentValue = this[variable]; 

  if (newValue == currentValue)
    return newValue;

  newValue = this.set_and_fire(variable, newValue);
  // note value may have changed twice

  if (this.here()) {
    if (variable == "name") {
      if (currentValue) {
        if (!newValue) {
          this.autobus.hbc.send(this.recipient + "freed/" + currentValue);
        } else {
          this.autobus.hbc.send(this.recipient + "model/" + currentValue + "/name", jsonize(newValue));
        }
      }
    } else {
      this.autobus.hbc.send(this.recipient + "model/" + this.name + "/" + variable, jsonize(newValue));
    }
  }

  return newValue;
}

BusAgent.prototype.setteds = function(deltaObj) {
  var name = this.name;

  var deltaObj2 = {};
  for (variable in deltaObj) {
    var newValue = deltaObj[variable];
    var currentValue = this[variable]; 

    if (newValue == currentValue) continue;

    newValue = this.set_and_fire(variable, newValue);

    if (newValue != currentValue)
     deltaObj2[variable] = newValue;
  }

  if (!name) name = this.name;

  if (this.here() && name)
    this.autobus.hbc.send(this.recipient + "model/" + name, jsonize(deltaObj2));
}

BusAgent.prototype.set = function(variable, value) {
   if (this.here()) {
       this.setted(variable, value);
   } else {
       
       this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/set/" + variable, jsonize(value));
   }
}

BusAgent.prototype.sets = function(deltaObj) {
   if (this.here()) {
       this.setteds(deltaObj);
   } else {
       this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/set", jsonize(deltaObj));
   }
}

BusAgent.prototype.call = function(fnName) {
   if (this.here()) {
       this[fnName].apply(this, arguments.splice(1));
   } else {
       this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/" + fnName, jsonize(arguments.splice(1)));
   }
}

BusAgent.prototype.getStatus = function() {
    var pic = {};  
    for (p in this) {
        if (typeof this[p] == "function" || !this.cbList[p]) continue;
        pic[p] = this[p];
    }
    return pic;
}

BusAgent.prototype.status = function() {
    if (this.here()) {
        var pic = this.getStatus();
        this.autobus.hbc.send(this.recipient + "model/" + this.name, jsonize(pic));
    } else
        this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/status", jsonize(value));
}
