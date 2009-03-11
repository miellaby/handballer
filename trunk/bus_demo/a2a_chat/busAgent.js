// library "Bus Agent" :
// A Bus Agent is a Pub/Sub Agent distributed over the web
// thanks to Handballer HTTP Bus.
// If it is "here", you may directly set its attributs
// It it is "there", you may set a value by pass it through the bus
// =========================================================================

function BusAgent(name, here) {
  PubSubAgent.call(this);
  this.name = name;
  this.here = (here === undefined ? false : here);
};

BusAgent.prototype = new PubSubAgent();
BusAgent.prototype.constructor = BusAgent;

BusAgent.prototype.set = function(variable, newValue) {
   if (this.here) {
       this.setted(variable, newValue);
       hbc.send(this.name + "/equal/" + variable, newValue);       
   } else {
       hbc.send(this.name + "/set/" + variable, newValue);
   }
}
