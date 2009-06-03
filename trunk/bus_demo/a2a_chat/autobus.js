// =========================================================================
// autobus
// =========================================================================

function Autobus(hbc) {
   this.tagsonomy = new PubSubAgent();
   this.hbc = (hbc ? hbc : new Hbc());
   Autobus.singleton = this;
};

Autobus.singleton = null;

Autobus.prototype.callback = function(label, body) {
   var obj = null ;
   var variable = null ;
   var command = null ;
   var id = null ;

   if (label.substring(0,6)== "freed/") {
      var agentName = label.substring(6);
      obj = this.tagsonomy.getOr(agentName,[])[0];
      if (obj && obj.there()) obj.forget();
      return;
   }

   if (label.substring(0,8)== "control/") {
      var slashIdx = label.indexOf("/",8);
      var slash2Idx = label.indexOf("/", slashIdx+1);
      var agentName = label.substring(8, slashIdx);
      var command=null, parameter=null;
      if (slash2Idx!=-1) {
        command = label.substring(slashIdx + 1, slash2Idx);
        parameter = label.substr(1 + slash2Idx);
      } else {
        command = label.substring(slashIdx + 1);
      }

      for (var lst = this.tagsonomy.getOr(agentName,[]), l = lst.length, i = 0; i < l; i++) {
        var obj = lst[i];
        if (!obj.here()) continue;
        if (command == "set") {
           if (parameter)
             obj.set(parameter, eval("(" + body + ")"));
           else
             obj.sets(eval("(" + body + ")"));
        } else {
           obj.get(command).apply(this, eval("[" + body + "]"));
        }
      }

   } else if (label.substring(0,6) == "model/") {
      var slashIdx = label.indexOf("/", 6);
 
      var agentName = slashIdx != -1 ? label.substring(6, slashIdx) : label.substring(6);
      var slot = slashIdx != -1 ? label.substring(slashIdx + 1) : undefined;
      
      obj = this.tagsonomy.getOr(agentName,[])[0];

      if (!obj) {
         obj = new BusAgent(this, agentName, BusAgent.prototype.there);
      }
 
      if (obj.there()) {
         if (slot)
           obj.setted(slot, eval("(" + body + ")"));
         else
           obj.setteds(eval("(" + body + ")"));
      } 

   } else if (label.substring(0,7) == "status/") {
      var agentName = label.substring(7);
  
      for (var lst = this.tagsonomy.getOr(agentName,[]), l = lst.length, i = 0; i < l; i++) {
        var obj = lst[i];
        if (!obj.here()) continue;
        obj.status();
      } 
   }
}

Autobus.prototype.init = function() {
  var a = this;
  this.hbc.receiveCB = function(l,b) { return a.callback(l,b); };
  this.hbc.init();
  this.hbc.send("status/here", "");
}
