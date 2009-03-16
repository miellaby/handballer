// =========================================================================
// autobus
// =========================================================================

function Autobus(hbc) {
   this.tagsonomy = new IndexAgent();
   this.hbc = (hbc ? hbc : new Hbc());
};


Autobus.prototype.messageCB = function(label, body) {
  var obj = null ;
  var variable = null ;
  var command = null ;
  var id = null ;

  if (label.substring(0,6)== "freed/")
    {
      var agentName = label.substring(6);
      obj = this.tagsonomy.getIndex(agentName)[0];
      if (obj && obj.there()) obj.forget();
      return;
    }

  if (label.substring(0,8)== "control/")
    {
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

      obj = this.tagsonomy.getIndex(agentName);
      if (obj && obj.here()) {
        if (command == "set") {
           obj.set(parameter, eval("(" + body + ")"));
        } else {
           obj.get(command).apply(this, eval("[" + body + "]"));
        }
      }

   } else if (label.substring(0,6) == "model/") {

      var slashIdx = label.indexOf("/",6);
      var agentName = label.substring(6, slashIdx);
      var slot = label.substring(slashIdx + 1);
      
      obj = this.tagsonomy.getIndex(agentName)[0];

      if (!obj) {
         obj = new BusAgent(this, agentName, BusAgent.prototype.there);
      }
 
      if (obj.there()) {
         obj.setted(slot, eval("(" + body + ")"));
      } 
   }
}

Autobus.prototype.init = function() {
  var a = this;
  this.hbc.receiveCB = function(l,b) { return a.messageCB(l,b); };
  this.hbc.init();
}
