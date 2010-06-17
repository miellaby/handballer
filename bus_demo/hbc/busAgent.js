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

  if ((location == BusAgent.prototype.HERE || location == BusAgent.prototype.BOTH) && autobus.agora)
      this.setted("abcli", autobus.hbc.token + autobus.hbc.clientId);

  this.location = (location === undefined ? BusAgent.prototype.THERE : location);

  if (this.here()) {
      if (this.tagsonomy && name)
          this.tagsonomy.pushIn("here", this);
  }
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;
BusAgent.prototype.HERE = 1; // means: local agent. Its changes are advertised via the bus. 
BusAgent.prototype.THERE = 2; // mean: proxified agent. Actions are translated into bus messages.
BusAgent.prototype.BOTH = 3; // means: local agent but 1/more copies may be on the bus as well.

BusAgent.prototype.here = function() {
   return this.location !== undefined && this.location !== BusAgent.prototype.THERE;
};

BusAgent.prototype.there = function() {
   return this.location !== BusAgent.prototype.HERE;
};

BusAgent.prototype.setted = function(variable, newValue) { 
    if (newValue != this[variable])
        this.set_and_fire(variable, newValue);
};

BusAgent.prototype.setteds = function(deltaObj) {
    for (variable in deltaObj) {
        var newValue = deltaObj[variable];
        if (newValue != this[variable])
            this.set_and_fire(variable, newValue);
    }
};

BusAgent.prototype.set = function(variable, value) {
   if (this.here() && value == this[variable])
           return value;

    if (this != this.autobus.toTell) {
        if (this.autobus.toTell !== undefined)
            this.tell();
        else
            this.autobus.delta = {};
        this.autobus.toTell = this;
        this.autobus.toTellName = this.name;
    }

    if (this.autobus.toTellTimeout === undefined) {
        var self = this;
        this.autobus.toTellTimeout = setTimeout(function() { self.autobus.toTellTimeout = undefined; self.tell(); }, 0);
    }

   if (this.here()) { // do
       value = this.set_and_fire(variable, value);
       // note value may have changed a second time here
   }
   this.autobus.delta[variable] = value;
   if (variable == "name" && value) this.autobus.toTellName = value ;
   return value;
};

BusAgent.prototype.sets = function(deltaObj) {
    for (variable in deltaObj) {
        this.set(variable, deltaObj[variable]);
    }
};

BusAgent.prototype.tell = function() {
    var toTell = this.autobus.toTell;
    if (!toTell) return;

    if (toTell.here()) {
       this.autobus.hbc.send(toTell.recipient + "model/" + this.autobus.toTellName, jsonize(this.autobus.delta));

       if (!toTell.name)
           this.autobus.hbc.sendNow(toTell.recipient + "freed/" + this.autobus.toTellName, null);
    } else {
       this.autobus.hbc.send((toTell.abcli ? toTell.abcli : this.autobus.agora) + "control/" + this.autobus.toTellName + "/set", jsonize(this.autobus.delta));
    }
    this.autobus.delta = {};
    if (this.autobus.toTellTimeout !== undefined)
        clearTimeout(this.autobus.toTellTimeout);
    this.autobus.toTellTimeout = undefined;
    this.autobus.toTell = undefined;
    this.autobus.toTellName = undefined;
};

BusAgent.prototype.call = function(fnName) {
   if (this.here()) {
       this[fnName].apply(this, arguments.splice(1));
   } else {
       this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/" + fnName, jsonize(arguments.splice(1)));
   }
};

BusAgent.prototype.getStatus = function() {
    var pic = {};  
    for (p in this) {
        if (typeof this[p] == "function" || !this.cbList[p]) continue;
        pic[p] = this[p];
    }
    return pic;
};

BusAgent.prototype.status = function() {
    if (this.here()) {
        var pic = this.getStatus();
        this.autobus.hbc.send(this.recipient + "model/" + this.name, jsonize(pic));
    } else
        this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/status", jsonize(value));
};
