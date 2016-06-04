// =========================================================================
// hbc : HandBaller HTTP Bus Client Package
//
// parameters:
// - baseURL: bus base URL
// - pattern: message subscribing pattern
// - receiveCB: message receiving callback
// - pollPeriod: pooling loop period if any
// - clientId: to distinguish several bus connection within an user agent
// - token: a (somewhat unique) token
//
// public methods:
// - send(label,body): send a message
// =========================================================================

function Hbc() {
  this.baseURL = "/bus/";
  this.pattern = "**";
  this.clientId = "top";
  this.token = String(Number(new Date()) % (Math.random() * 0xAFF00000)).substr(0,9);
  this.count = 0;
  this.timeShift = 0;
}

Hbc.prototype.logCB = null;

// bus message sending section
// =========================================================================

// private function to send one message out of the FIFO queue
Hbc.prototype.sendOne = function(label, body) {
  this.isSending=true;

  if (this.logCB) this.logCB("sending " + label + ": " + body);
  this.sendXhr.open("POST", this.baseURL + label, true);
  var hbc = this;
  this.sendXhr.onreadystatechange = function() {
     if (hbc.sendXhr.readyState >= 4) {
        hbc.isSending = false;
        hbc.sendNext();
  } };
  this.sendXhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
  this.sendXhr.send(body || '');
};

// private function called back when a message sending is done
Hbc.prototype.sendNext = function() {
    if (this.sendXhr.readyState >= 4) {
        var serverTime = this.sendXhr.getResponseHeader('Date');
        if (serverTime) {
            serverTime = Number(new Date(serverTime));
            var delta = serverTime - Number(new Date());
            this.timeShift = (this.timeShift * this.count + delta) / ++this.count;
        }
    }

  var next = this.sendFifo.shift();
  if (next)
     this.sendOne(next[0], next[1]);
};

// public function to send a message on the bus
Hbc.prototype.send = function(label, body) {
  this.sendFifo.push([label, body]);
  if (this.isSending) return;
  this.sendNext();
};

// send a message immediatly and synchronously
Hbc.prototype.sendNow = function(label, body) {
   var one = new XMLHttpRequest();
   one.open("POST", this.baseURL + label, false);
   one.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
   one.send(body || '');
}

// bus message receiving section
// =========================================================================

// private function to subscribe
Hbc.prototype.subscribe = function() {
   var self = this;
   var url =  this.baseURL + this.pattern + "?event&label";
   this.evtSource = new EventSource(url, {
      withCredentials: true,
   });
   this.evtSource.onmessage = function (event) {
      var label = "what"
      var d = event.data
      var i = d.indexOf("\n");
      var label = d.substring(0, i);
      var body = d.substring(i + 1);
      if (self.logCB) self.logCB("receiving " + label + ": " + body);
      self.receiveCB(label, body);
   };
}

// initialize the library
Hbc.prototype.init = function() {
  // recyclable message sending dedicated XHR
  this.sendXhr = new XMLHttpRequest();

  // sending status
  this.isSending = false;

  // to-be-sent messages queue
  this.sendFifo = [];

  // open the receiving XHR
  this.subscribe();
}
