// cookies management
var cookies = {
   get:  function(name) {
      var start = document.cookie.indexOf(name + "=");
      if (start == -1) return null;
      var len = start + name.length + 1;
      var end = document.cookie.indexOf(";", len);
      if (end == -1) end = document.cookie.length;
      return unescape(document.cookie.substring(len, end));
   },
   set: function(name, value, expires, path, domain, secure) {
      document.cookie = name + "=" + escape(value) +
          ( expires ? ";expires=" + expires.toGMTString() : "") +
          ( path ? ";path=" + path : "") + 
          ( domain ? ";domain=" + domain : "") +
          ( secure ? ";secure" : "");
   }
};
