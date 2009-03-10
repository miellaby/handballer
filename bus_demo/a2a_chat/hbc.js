// =========================================================================
// hbc : HandBaller HTTP Bus Client Package
// =========================================================================

// hbc skeleton
// =========================================================================
var hbc = {
   // initial parameters
   baseURL: undefined, // bus base URL
   pattern: undefined, // message subscribing pattern
   receiveCB: undefined, // message receiving callback
   
   // optional parameters
   pollPeriod: 200, // 200 ms interval when polling is necessary

   // public methods
   init: undefined,  // initialize the library
   send: undefined,  // send a message on the bus

   // private methods and attributes
   sendFifo: undefined, // to-be-sent messages queue
   isSending: undefined, // sending status
   sendXhr: undefined, // recyclable message sending dedicated XHR
   sendOne: undefined, // private function to send one message out of the FIFO queue
   sendNext: undefined, // private callback once called when one message has been sent
   openXHR: undefined, // private function to open a receiving XHR
   receiveXHR: undefined, // bus message receiving dedicated XHR
   lastXHRState: undefined, // to detect XHR state change
   poll: undefined, // to poll new messages in receiving XHR if required
   pollIdx: undefined // for polling
} ;

// bus message sending section
// =========================================================================

hbc.sendFifo = [] ;
hbc.isSending = false ;

hnc.sendOne = function(label, body) {
  hbc.isSending=true ;

  hbc.sendXhr.open("POST", hbc.prefix + label, true) ;

  hbc.sendXhr.onreadystatechange = function() {
     if (hbc.sendXhr.readyState >= 3) {
        hbc.isSending = false;
        hbc.sendNext();
  } } ;

  hbc.sendXhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
  hbc.sendXhr.send(body == null ? "" : "" + body);
};

hbc.sendNext = function() {
  var next = hbc.sendFifo.shift();
  if (next)
     hbc.sendOne(next[0], next[1]);
};

hbc.send = function(label, body) {
  hbc.sendFifo.push([label, body]) ;
  if (hbc.isSending) return;
  hbc.sendNext() ;
};

// bus message receiving section
// =========================================================================

hbc.lastXHRstate = -1;

// pooling loop when bad XHR
var hbc.poll = function() {
   if (hbc.receiveXHR.readyState < 3) return;

   var r = hbc.receiveXHR.responseText;

   while (true) { // received message parsing loop
      var labelSizeEndIdx = r.indexOf("\n", hbc.pollIdx);
      if (labelSizeEndIdx == -1) break;
      var labelSize = parseInt("0x" + r.substring(hbc.pollIdx, labelSizeEndIdx));
      var bodySizeIdx = 1 + labelSizeEndIdx + labelSize;
      if (bodySizeIdx >= r.length) break ;
      var bodySizeEndIdx = r.indexOf("\n", bodySizeIdx);
      if (bodySizeEndIdx == -1) break;
      var bodySize = parseInt("0x" + r.substring(bodySizeIdx, bodySizeEndIdx)) ;
      var bodyIdx = 1 + bodySizeEndIdx;
      if (bodyIdx + bodySize >= r.length) break;
      var label = r.substring(1 + labelSizeEndIdx, bodySizeIdx);
      var body = r.substr(bodyIdx, bodySize);
      try {
         hbc.receiveCB(label, body) ;
      } catch (e) {
         hbc.send("log/www-browser", e.message + " [" + e.name + "]") ;
      }
      hbc.pollIdx = bodyIdx + bodySize + 1;
   }

   if (hbc.receiveXHR.readyState == 4) {
        // if connexion is stopped, let's relaunch it
        hbc.receiveXHR.abort();
        hbc.openXHR();
   } else {
        hbc.lastXHRstate = hbc.receiveXHR.readyState ;
   }
};


hbc.openXHR() = function() {
  hbc.pollIdx = 0;
  hbc.lastXHRstate = -1;
  hbc.receiveXHR = new XMLHttpRequest();

  if (hbc.receiveXHR.multipart !== undefined)
    { // newest Gecko versions : multipart support
      hbc.receiveXHR.multipart = true;

      hbc.receiveXHR.onload = function(e) {
        var r = hbc.receiveXHR.responseText;
        var i = r.indexOf("\n") ;
        var labelSize = parseInt("0X" + r.substring(0, i));
        var label = r.substring(i + 1, i + 1 + labelSize);
        i = i + 1 + labelSize;
        var j = r.indexOf("\n", i);
        var messageSize = parseInt("0X" + r.substring(i, j));
        var message = r.substring(j + 1, j + 1 + messageSize);
        hbc.receiveCB(label, message);
      };

    }

  hbc.receiveXHR.open('GET', baseURL + pattern + "&label&indexed&timestamp=" + Number(new Date()), true), true);       
  hbc.receiveXHR.send(null);
};

hbc.init = function(baseURL, pattern, receiveCB) {
  hbc.baseURL = baseURL;
  hbc.pattern = pattern;
  hbc.receiveCB = receiveCB;

  hbc.sendXhr = new XMLHttpRequest() ;
  hbc.openXHR(s);

  if (hbc.receiveXHR.multipart === undefined)
     // no multipart support ==> polling
     setInterval(hbc.poll, hbc.pollPeriod);
};

