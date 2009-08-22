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
