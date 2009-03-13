// =========================================================================
// hbc : HandBaller HTTP Bus Client Package
//
// parameters:
// - baseURL: bus base URL
// - pattern: message subscribing pattern
// - receiveCB: message receiving callback
// - pollPeriod: pooling loop period if any
// - clientId: to distinguish several bus connection within an user agent
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
}

// bus message sending section
// =========================================================================

// private function to send one message out of the FIFO queue
Hbc.prototype.sendOne = function(label, body) {
  this.isSending=true;

  this.sendXhr.open("POST", this.baseURL + label, true);
  var hbc = this;
  this.sendXhr.onreadystatechange = function() {
     if (hbc.sendXhr.readyState >= 3) {
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
      var labelSizeEndIdx = r.indexOf("\n", this.pollIdx);
      if (labelSizeEndIdx == -1) break;
      var labelSize = parseInt("0x" + r.substring(this.pollIdx, labelSizeEndIdx));
      var bodySizeIdx = 1 + labelSizeEndIdx + labelSize;
      if (bodySizeIdx >= r.length) break;
      var bodySizeEndIdx = r.indexOf("\n", bodySizeIdx);
      if (bodySizeEndIdx == -1) break;
      var bodySize = parseInt("0x" + r.substring(bodySizeIdx, bodySizeEndIdx));
      var bodyIdx = 1 + bodySizeEndIdx;
      if (bodyIdx + bodySize >= r.length) break;
      var label = r.substring(1 + labelSizeEndIdx, bodySizeIdx);
      var body = r.substr(bodyIdx, bodySize);
      try {
         this.receiveCB(label, body);
      } catch (e) {
         this.send("log/www-browser", e.message + " [" + e.name + "]");
      }
      this.pollIdx = bodyIdx + bodySize + 1;
   }

   if (this.receiveXHR.readyState == 4) {
        // if connexion is stopped, let's relaunch it
        this.receiveXHR.abort();
        this.openXHR();
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

  if (this.receiveXHR.multipart !== undefined) {
     // newest Gecko versions : multipart support
     this.receiveXHR.multipart = true;
     var hbc = this;
     this.receiveXHR.onload = function(e) {
        var r = hbc.receiveXHR.responseText;
        var i = r.indexOf("\n");
        var labelSize = parseInt("0X" + r.substring(0, i));
        var label = r.substring(i + 1, i + 1 + labelSize);
        i = i + 1 + labelSize;
        var j = r.indexOf("\n", i);
        var messageSize = parseInt("0X" + r.substring(i, j));
        var message = r.substring(j + 1, j + 1 + messageSize);
        hbc.receiveCB(label, message);
     };
  }

  var url =  this.baseURL + this.pattern + "?label&indexed&timestamp=" + Number(new Date());
  if (!this.receiveXHR.multipart)
    url += "&flush&box=" + this.clientId;

  this.receiveXHR.open('GET', url, true);
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
  
  if (this.receiveXHR.multipart === undefined)
     // no multipart support ==> polling
     this.pollInterval = setInterval(this.poll, this.pollPeriod);
}
