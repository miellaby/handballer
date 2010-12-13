// client-side cookies management through window.name property
var wookies = {
   t: null,
   init: function() {
      var name = window.name;
      wookies.t = (name ? eval(name) : {});
   },
   get:  function(name) {
      if (!wookies.t) wookies.init();
      return wookies.t[name];
   },
   set: function(name, value, noflush) {
      if (!wookies.t) wookies.init();
      wookies.t[name] = value;
      if (!noflush) window.name = jsonize(wookies.t);
   }
};
