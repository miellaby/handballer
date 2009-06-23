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
