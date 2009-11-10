// console
if (typeof console != "object") var console = { log: function() {} };

// occurences removal helper
if (Array.prototype.remove === undefined) {
   Array.prototype.remove = function(s){
      var i = this.indexOf(s);
      while (i != -1) {
         this.splice(i, 1);
         i = this.indexOf(s,i);
      }
   }
}

function getURLParameters(a) {
    a = a || window.location.href;
    var params = {};
    var regex = /[\?&]([^=]+)=([^&]*)/g;
	while( ( results = regex.exec( a ) ) != null )
		params[results[1]] = results[2];
    return params;
}


(function() {
    var urlParameters = null;
    window.getURLParameterByName = function(name) {
        if (!urlParameters) urlParameters = getURLParameters();
        return urlParameters[name];
    };
})();

// String method to get a base-64 encoding
String.prototype.b64 = function() {
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = this.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (this.charCodeAt(i) << 16)
                | (i + 1 < len ? this.charCodeAt(i+1) << 8 : 0)
                | (i + 2 < len ? this.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > this.length * 8) break;
      output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
}

//
//  getWindowDimensions()
//
window.getWindowDimensions = function(window) {
   var xScroll, yScroll;
   var document = window.document;

   if (window.innerHeight && window.scrollMaxY) {	
      xScroll = window.innerWidth + window.scrollMaxX;
      yScroll = window.innerHeight + window.scrollMaxY;
   } else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
      xScroll = document.body.scrollWidth;
      yScroll = document.body.scrollHeight;
   } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
      xScroll = document.body.offsetWidth;
      yScroll = document.body.offsetHeight;
   }
		
   var windowWidth, windowHeight;
		
   if (this.innerHeight) {	// all except Explorer
      if (document.documentElement.clientWidth){
         windowWidth = document.documentElement.clientWidth; 
      } else {
         windowWidth = this.innerWidth;
      }
      windowHeight = this.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
        windowWidth = document.documentElement.clientWidth;
        windowHeight = document.documentElement.clientHeight;
    } else if (document.body) { // other Explorers
       windowWidth = document.body.clientWidth;
       windowHeight = document.body.clientHeight;
    }
	
   // for small pages with total height less then height of the viewport
   if (yScroll < windowHeight){
      pageHeight = windowHeight;
   } else { 
      pageHeight = yScroll;
   }
	
   // for small pages with total width less then width of the viewport
   if (xScroll < windowWidth){	
      pageWidth = xScroll;		
   } else {
      pageWidth = windowWidth;
   }

   return [pageWidth, pageHeight];
}

window.getEltDimensions = function(elt) {
 var d = elt.style.display;
 if (d && d != 'none')
    return [elt.offsetWidth, elt.offsetHeight];

 var v = elt.style.visibility;
 elt.style.visibility = 'hidden';
 elt.style.display='block';
 var w = elt.clientWidth, h = elt.clientHeight;
 elt.style.display = d;
 elt.style.visibility = v;
 return [w, h];
}

