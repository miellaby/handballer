// =========================================================================
// autobus
// a layer upon HandBaller client layer to automize bus agents inter communication
// =========================================================================

function Autobus(agora, hbc) {
   this.agora = agora ? agora + "/" : "";
   this.tagsonomy = new PubSubState();
   this.hbc = (hbc ? hbc : new Hbc());
};

Autobus.singleton = undefined;
Autobus.factory = function(agora, hbc) {
  Autobus.singleton = Autobus.singleton || new Autobus(agora, hbc);
  return Autobus.singleton;
}


// Bus agent factory,
// If the named agent already exists, one returns it without creating a second copy.
Autobus.prototype.busState = function(name, location, recipient) {
    var e = this.tagsonomy.getOr(name, null);
    if (e) { // if the agent exists both here and there, one takes note of it
        if (location == e.HERE && e.location == e.THERE ||
            location == e.THERE && e.location == e.HERE)
            e.location = e.BOTH;
        return e;
    }
    return new BusState(this, name, location, recipient);
}

Autobus.prototype.callback = function(label, body) {
   var obj = null ;
   var variable = null ;
   var id = null ;

   if (this.agora)
       if (label.indexOf(this.agora) == 0)
           // agora message
           label = label.substring(this.agora.length);
       else
           // private message
           label = label.substring(this.agora.indexOf("/") + 1);

   if (label.substring(0,6)== "freed/") {
      var agentName = label.substring(6);
      obj = this.tagsonomy.getOr(agentName,null);
      if (obj) {
          if (!obj.here())
              obj.forget(); // really there (not both)
          else
              obj.status(); // one won't let people believe there is no more copy 
      }
      return;
   }

   if (label.substring(0,8)== "control/") {
      var slashIdx = label.indexOf("/",8);
      var slash2Idx = label.indexOf("/", slashIdx+1);
      var who = label.substring(8, slashIdx);
      var command = null, parameter = null;
      if (slash2Idx!=-1) {
        command = label.substring(slashIdx + 1, slash2Idx);
        parameter = label.substr(1 + slash2Idx);
      } else {
        command = label.substring(slashIdx + 1);
      }
      var agents = this.tagsonomy.getOr(who, []);
      if (!agents.indexOf) agents = [agents];
      for (var lst = agents, l = lst.length, i = 0; i < l; i++) {
        var obj = lst[i];
        if (!obj.here()) continue;
        if (command == "set") {
           if (parameter)
             obj.set(parameter, JSON.parse(body));
           else
             obj.sets(JSON.parse(body));
        } else {
           obj.get(command).apply(this, JSON.parse("[" + body + "]"));
        }
      }

   } else if (label.substring(0,6) == "model/") {
      var slashIdx = label.indexOf("/", 6);
 
      var agentName = slashIdx != -1 ? label.substring(6, slashIdx) : label.substring(6);
      var slot = slashIdx != -1 ? label.substring(slashIdx + 1) : undefined;
      
      obj = this.busState(agentName, BusState.prototype.THERE);
 
      if (obj.there()) {
         if (slot)
           obj.setted(slot, JSON.parse(body));
         else
           obj.setteds(JSON.parse(body));
      } 

   } else if (label.substring(0,7) == "status/") {
      var who = label.substring(7);
      var agents = this.tagsonomy.getOr(who, []);
      if (!agents.indexOf) agents = [agents];

      for (var lst = agents, l = lst.length, i = 0; i < l; i++) {
        var obj = lst[i];
        if (!obj.here()) continue;
        obj.status();
      } 
   }
}

Autobus.prototype.init = function() {
  var a = this;

  // agora is a label common root path where all public messages are sent
  // if set, one may also send private messages to a given UA via its special "token" label
  if (this.agora) {
      this.hbc.pattern =  this.hbc.token + this.hbc.clientId + "/**|" + this.agora + "**";
    } else {
      this.hbc.pattern = "**";
  }
      
  this.hbc.receiveCB = function(l,b) { return a.callback(l,b); };
  this.hbc.init();
  this.hbc.send(this.agora + "status/here", "");
}
