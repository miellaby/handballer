// client-side cookies management through window.name property
var wookies = {
   t: null,
   init: function() {
      try {
         wookies.t = JSON.parse(window.name || "{}");
      } catch (e) {
         console.log(e);
      }
   },
   get:  function(name) {
      wookies.t || wookies.init();
      return wookies.t[name];
   },
   set: function(name, value, noflush) {
      wookies.t || wookies.init();
      wookies.t[name] = value;
      if (!noflush) window.name = JSON.stringify(wookies.t);
   }
};
