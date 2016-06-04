(function () {
   const urlParams = new URLSearchParams(window.location.search);
   window.getURLParameterByName = function (name) {
      return urlParams.get(name);
   };
})();

// String method to get a base-64 encoding
window.str2b64 = function(str) {
   var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
   var output = "";
   var len = this.length;
   for (var i = 0; i < len; i += 3) {
      var triplet = (this.charCodeAt(i) << 16)
         | (i + 1 < len ? this.charCodeAt(i + 1) << 8 : 0)
         | (i + 2 < len ? this.charCodeAt(i + 2) : 0);
      for (var j = 0; j < 4; j++) {
         if (i * 8 + j * 6 > this.length * 8) break;
         output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
      }
   }
   return output;
}

//
//  getWindowDimensions()
//
window.getWindowDimensions = function (window) {
   const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
   const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
   return [ width, height ];
}

window.getEltDimensions = function (element) {
   const wasHidden = element.style.display === 'none';
   if (wasHidden) {
       element.style.display = 'block';
   }
   const rect = element.getBoundingClientRect();
   if (wasHidden) {
       element.style.display = 'none';
   }
   return [ rect.width, rect.height ];
}

