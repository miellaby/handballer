// =========================================================================
// autobus
// a layer upon HandBaller client layer to automize bus agents inter communication
// =========================================================================

function Autobus(agora, hbc) {
  this.agora = agora ? agora + "/" : "";
  this.tagsonomy = new PubSubState();
  this.index = new PubSubState();
  this.hbc = (hbc ? hbc : new Hbc());
};

Autobus.singleton = undefined;
Autobus.factory = function (agora, hbc) {
  Autobus.singleton = Autobus.singleton || new Autobus(agora, hbc);
  return Autobus.singleton;
}


// Bus agent factory,
// If the named agent already exists, one returns it without creating a second copy.
Autobus.prototype.busState = function (name, location, recipient) {
  var e = this.index.getOr(name, null);
  if (e) { // if the agent exists both here and there, one takes note of it
    if (location == e.HERE && e.location == e.THERE ||
      location == e.THERE && e.location == e.HERE)
      e.location = e.BOTH;
    return e;
  }
  return new BusState(this, name, location, recipient);
}

Autobus.prototype.onMessage = function (label, body) {
  let state = null;
  let variable = null;
  let id = null;

  if (this.agora)
    if (label.indexOf(this.agora) == 0)
      // agora message
      label = label.substring(this.agora.length);
    else
      // private message
      label = label.substring(this.agora.indexOf("/") + 1);

  if (label.substring(0, 6) == "freed/") {
    let stateName = label.substring(6);
    state = this.index.getOr(stateName, null);
    if (state) {
      if (!state.here())
        state.forget(); // really there (not both)
      else
        state.status(); // one won't let people believe there is no more copy 
    }
    return;
  }

  if (label.substring(0, 8) == "control/") {
    let slashIdx = label.indexOf("/", 8);
    let slash2Idx = label.indexOf("/", slashIdx + 1);
    let who = label.substring(8, slashIdx);
    let command = null, parameter = null;
    if (slash2Idx != -1) {
      command = label.substring(slashIdx + 1, slash2Idx);
      parameter = label.substr(1 + slash2Idx);
    } else {
      command = label.substring(slashIdx + 1);
    }
    let states = this.index.getOr(who, []);
    if (!states.indexOf) states = [states];
    for (let lst = states, l = lst.length, i = 0; i < l; i++) {
      let state = lst[i];
      if (!state.here()) continue;
      if (command == "set") {
        if (parameter)
          state.set(parameter, JSON.parse(body));
        else
          state.sets(JSON.parse(body));
      } else {
        state.get(command).apply(this, JSON.parse("[" + body + "]"));
      }
    }

  } else if (label.substring(0, 6) == "model/") {
    let slashIdx = label.indexOf("/", 6);

    let stateName = slashIdx != -1 ? label.substring(6, slashIdx) : label.substring(6);
    let slot = slashIdx != -1 ? label.substring(slashIdx + 1) : undefined;

    state = this.busState(stateName, BusState.prototype.THERE);

    if (state.there()) {
      if (slot)
        state.setted(slot, JSON.parse(body));
      else
        state.setteds(JSON.parse(body));
    }

  } else if (label.substring(0, 7) == "status/") {
    var tag = label.substring(7);
    var states = this.tagsonomy.getOr(tag, []);
    states.forEach(s => s.here() && s.status());
  }
}

Autobus.prototype.init = function () {
  var a = this;

  // agora is a label common root path where all public messages are sent
  // if set, one may also send private messages to a given UA via its special "token" label
  if (this.agora) {
    this.hbc.pattern = this.hbc.token + this.hbc.clientId + "/**|" + this.agora + "**";
  } else {
    this.hbc.pattern = "**";
  }

  this.hbc.receiveCB = function (l, b) { return a.onMessage(l, b); };
  this.hbc.init();
  this.hbc.send(this.agora + "status/here", "");
}
