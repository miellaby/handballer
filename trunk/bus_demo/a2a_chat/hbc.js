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
  // default settings
  this.baseURL = "/bus/";
  this.pattern = "**";
  // 200 ms interval when polling is necessary
  this.pollPeriod = 200;
  // default client ID
  this.clientId = "top";
  this.token = String(Number(new Date()) % (Math.random() * 0xAFF00000)).substr(0,9);
  Hbc.singleton = this;
}

Hbc.singleton = null;
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
  this.sendXhr.send(body == null ? "" : "" + body);
};

// private function called back when a message sending is done
Hbc.prototype.sendNext = function() {
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

// bus message receiving section
// =========================================================================

// pooling loop when bad XHR
Hbc.prototype.poll = function() {
   if (this.receiveXHR.readyState < 3) return;

   var r = this.receiveXHR.responseText;

   while (true) { // received message parsing loop
      var labelEnd = r.indexOf("\x00", this.pollIdx);
      if (labelEnd == -1) break;
      var bodyEnd = r.indexOf("\x00", labelEnd + 1);
      if (bodyEnd == -1) break;
      var label = r.substring(this.pollIdx, labelEnd);
      var body = r.substring(labelEnd + 1, bodyEnd);
      try {
         if (this.logCB) this.logCB("receiving " + label + ": " + body);
         this.receiveCB(label, body);
      } catch (e) {
         if (this.logCB) this.logCB("error in CB: " + e.message + " [" + e.name + "]");
      }
      this.pollIdx = bodyEnd + 1;
   }

   if (this.receiveXHR.readyState == 4) {
         if (this.logCB) {
           var junk = r.substr(this.pollIdx);
           if (junk) this.logCB("unparsed junk: " + junk);
        }

        //this.receiveXHR.abort(); // useless afak

        // if connection aborted, try to relaunch it once
        if (this.lastXHRstate >= 3) this.openXHR();
   } else {
        this.lastXHRstate = this.receiveXHR.readyState;
   }
};


// private function to open a receiving XHR
Hbc.prototype.openXHR = function() {

  // to poll new messages in receiving XHR if required
  this.pollIdx = 0; // for polled XHR response parsing
  this.lastXHRstate = -1; // for XHR state change detection


  // bus message receiving dedicated XHR
  this.receiveXHR = new XMLHttpRequest();

  this.multipartSupport = (this.receiveXHR.multipart !== undefined);
  // this.multipartSupport = false; // for my test on FF3
  if (this.multipartSupport) {
     // newest Gecko versions : multipart support
     this.receiveXHR.multipart = true;
     var hbc = this;
     this.receiveXHR.onload = function(e) {
        var r = hbc.receiveXHR.responseText;
        var i = r.indexOf("\n");
        var label = r.substring(0, i);
        var body = r.substring(i + 1);
        if (hbc.logCB) hbc.logCB("receiving " + label + ": " + body);
        hbc.receiveCB(label, body);
     };
  }

  var url =  this.baseURL + this.pattern + "?label&timestamp=" + Number(new Date());
  if (this.multipartSupport)
     url += "&push=XYZ";
  else
     url += "&null&flush&box=" + this.token + this.clientId;

  this.receiveXHR.open('GET', url, true);

  if (!this.multipartSupport) {
     var hbc = this;
     this.receiveXHR.onreadystatechange = function() {
        hbc.poll();
     }
  }

  this.receiveXHR.send(null);
}

// initialize the library
Hbc.prototype.init = function() {

  if (this.pollInterval !== undefined) { // resilience to multiple init call
    clearInterval(this.pollInterval);
    this.pollInterval = undefined;
  }

  // recyclable message sending dedicated XHR
  this.sendXhr = new XMLHttpRequest();

  // sending status
  this.isSending = false;

  // to-be-sent messages queue
  this.sendFifo = [];

  // open the receiving XHR
  this.openXHR();
  
  if (0) { // no more polling since flush feature is available
    if (!this.multipartSupport) {
       var self = this;
       // no multipart support ==> polling
       this.pollInterval = setInterval(function() {
          try{
            self.poll();
          } catch(e) {
           if (self.logCB) self.logCB("error in poll: " + e.message + " [" + e.name + "]");
          }}, this.pollPeriod);
    }
  }
}
