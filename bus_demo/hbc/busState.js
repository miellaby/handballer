// library "BusState" :
// A Bus State is an Object distributed over an HTTP Bus
// via the "autobus" Javascript framework.
// - If it is "here", you may directly set its attributs
// - It it is "there", you may set a value via the bus
// - It also may be "both" mirrored here and there!
// =========================================================================

function BusState(autobus, name, location, recipient) {
    this.autobus = autobus;
    PubSubState.call(this, name, autobus && autobus.tagsonomy, autobus && autobus.index);
    if (!autobus) return; // prototype case handling
    this.location = location || BusState.prototype.THERE;
    this.recipient = recipient && recipient.abccli || this.autobus.agora;
    if ((location & BusState.prototype.HERE) && autobus.agora)
        this.setted("abcli", autobus.hbc.token + autobus.hbc.clientId);
    if (this.here() && this.tagsonomy && name)
        this.tagsonomy.pushIn("here", this);
};

BusState.prototype = new PubSubState();
BusState.prototype.constructor = BusState;
BusState.prototype.HERE = 1; // means: local agent. Its changes are advertised via the bus. 
BusState.prototype.THERE = 2; // mean: proxified agent. Actions are translated into bus messages.
BusState.prototype.BOTH = 3; // means: local agent but 1/more copies may be on the bus as well.

BusState.prototype.here = function () {
    return this.location !== undefined && this.location !== BusState.prototype.THERE;
};

BusState.prototype.there = function () {
    return this.location !== BusState.prototype.HERE;
};

BusState.prototype.setted = function (variable, newValue) {
    if (newValue != this[variable])
        this.set_and_fire(variable, newValue);
};

BusState.prototype.setteds = function (deltaObj) {
    Object.entries(deltaObj).forEach(e => {
        let [variable, newValue] = e
        if (variable !== 'tags' && newValue != this[variable]) {
            this.set_and_fire(variable, newValue);
        }
    });
    if (deltaObj.tags !== undefined && deltaObj.tags !== this.tags) {
        this.set_and_fire('tags', deltaObj.tags);
    } 
};

BusState.prototype.set = function (variable, value) {
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
        this.autobus.toTellTimeout = setTimeout(() => {
            this.autobus.toTellTimeout = undefined;
            this.tell();
        }, 0);
    }

    if (this.here()) { // do
        value = this.set_and_fire(variable, value);
        // note value may have changed a second time here
    }
    this.autobus.delta[variable] = value;
    if (variable == "name" && value) this.autobus.toTellName = value;
    return value;
};

BusState.prototype.sets = function (deltaObj) {
    Object.entries(deltaObj).forEach(e => {
        let [variable, value] = e;
        this.set(variable, value);
    });
};

BusState.prototype.tell = function () {
    var toTell = this.autobus.toTell;
    if (!toTell) return;

    if (toTell.here()) {
        this.autobus.hbc.send(toTell.recipient + "model/" + this.autobus.toTellName, JSON.stringify(this.autobus.delta));

        if (!toTell.name)
            this.autobus.hbc.sendNow(toTell.recipient + "freed/" + this.autobus.toTellName, null);
    } else {
        this.autobus.hbc.send((toTell.abcli ? toTell.abcli : this.autobus.agora) + "control/" + this.autobus.toTellName + "/set", JSON.stringify(this.autobus.delta));
    }
    this.autobus.delta = {};
    if (this.autobus.toTellTimeout !== undefined)
        clearTimeout(this.autobus.toTellTimeout);
    this.autobus.toTellTimeout = undefined;
    this.autobus.toTell = undefined;
    this.autobus.toTellName = undefined;
};

BusState.prototype.call = function (fnName) {
    if (this.here()) {
        this[fnName].apply(this, arguments.splice(1));
    } else {
        this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/" + fnName, JSON.stringify(arguments.splice(1)));
    }
};

BusState.prototype.getStatus = function () {
    var pic = {};
    for (var p in this) {
        if (typeof this[p] == "function" || !this.cbList[p]) continue;
        pic[p] = this[p];
    }
    return pic;
};

BusState.prototype.status = function () {
    if (this.here()) {
        var pic = this.getStatus();
        this.autobus.hbc.send(this.recipient + "model/" + this.name, JSON.stringify(pic));
    } else
        this.autobus.hbc.send((this.abcli ? this.abcli : this.autobus.agora) + "control/" + this.name + "/status", JSON.stringify(value));
};
