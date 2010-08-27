// ======================================================================
// A2A Chat application core
// ======================================================================
var autobus = new Autobus();

// ======================================================================
// helpers
// ======================================================================
function log(msg) {
    window.console && console.log(msg);
    //puts(msg);
}

if(0)
    autobus.hbc.logCB = function(msg) {
        puts("logCB: " + msg) ;
    };

// ======================================================================
// Default profiles of settings
// ======================================================================
var default_profiles = {
    red: {
        nickname: "red",
        icon: "./images/red.gif",
        mind: "happy",
        color: "red",
        emblem: ""
    },
    blue: {
        nickname: "blue",
        icon: "./images/blue.gif",
        mind: "cool",
        color: "blue",
        emblem: ""
    },
    green: {
        nickname: "green",
        icon: "./images/green.gif",
        mind: "watchful",
        color: "green",
        emblem: ""
    },
    pink: {
        nickname: "pink",
        icon: "./images/pink.gif",
        mind: "groovy",
        color: "pink",
        emblem: ""
    },
    purple: {
        nickname: "purple",
        icon: "./images/purple.gif",
        mind: "zen",
        color: "purple",
        emblem: ""
    },
    orange: {
        nickname: "orange",
        icon: "./images/orange.gif",
        mind: "open",
        color: "orange",
        emblem: ""
    }
};

// ======================================================================
// Settings Managing package
// ======================================================================

var settings = {
    cookieName: null,
    initial: null,
    current: null,
    saveTask: undefined,

    init: function(cookieName, default_profiles) {
        this.cookieName = cookieName;
        this.initial = default_profiles || {};
        this.current = Object.copy(this.initial);
        this.load();
    },

    load: function() {
        var restored = eval("(" + (cookies.get(this.cookieName) || "null") + ")");
        if (restored) this.current = restored;
    },
    
    doSave: function() {
        var expire = new Date();
        expire.setTime(expire.getTime() + 3600 * 24 * 1000 * 30);
        cookies.set(this.cookieName, jsonize(this.current), expire);
        this.saveTask = undefined;
    },

    save: function() { // actually data changes are gathered via a small delay to enhance perfs
        if (this.saveTask !== undefined) return; // already schedulled
        var self = this;
        // note the delay amount hereafter is irrevelant, the idea is just to update the cookie only once by set() salve
        this.saveTask = setTimeout(function() { self.doSave(); }, 500);
    },

    exist: function(key) {
        return (this.current[key] ? true : false);
    },

    duplicate: function(target, source) {
        this.current[target] = Object.copy(this.current[source]);
    },

    set: function(key, variable, value) {
        if (value == this.get(key, variable)) return; // nothing new here

        var c = this.current[key];
        if (!c) c = this.current[key] = {};
        c[variable] = value;
        
        this.save();
    },

    get: function(key, variable) {
        var c = this.current[key];
        return c ? c[variable] : c /* that is undefined */;
    },

    reset: function() {
        this.current = Object.copy(this.initial);
        this.doSave();
    }
};

// ======================================================================
// Attractor : accessor proxy which set backs a targeted variable to a
// default value after a delay.
// ======================================================================

function Attractor(agent, variable, delay, defaultValue) {
   this.agent = agent;
   this.variable = variable;
   this.delay = delay;
   this.timeout = undefined; 
   this.defaultValue = defaultValue;
   var self = this;
   this.cb = function () {
       self.timeout = undefined;
       self.agent.set(self.variable, self.defaultValue);
   };
}

Attractor.prototype.set = function(variable, value) {
   this.agent.set(variable, value);
   if (variable != this.variable) return value;
   if (this.timeout !== undefined) clearTimeout(this.timeout);
   if (value != this.defaultValue) {
      this.timeout = setTimeout(this.cb, this.delay);
    }
   return value;
};

// ======================================================================
// Summary : accessor proxy which determines the first variable
// equals to true in an ordered list of boolean variables and set a target
// variable to this variable name.
// ======================================================================

function Summary(agent, variable, levels, defaultValue) {
    this.agent = agent;
    this.variable = variable;
    this.levels = levels;
    this.defaultValue = defaultValue;
    this.status = {};
    this.currentLevel = levels.length;
    agent.set(variable, defaultValue);
}

Summary.prototype.set = function(variable, value) {
    this.status[variable] = value;
    var i = this.levels.indexOf(variable);
    if (i == -1) return value;
    if (value && i < this.currentLevel) {
       this.agent.set(this.variable, variable);
       this.currentLevel = i;
    }
    if (!value && i == this.currentLevel) {
       var s = this.levels.length;
       for (i++; i < s; i++) {
          if (this.status[this.levels[i]]) break;
       }
       this.agent.set(this.variable, i < s ? this.levels[i] : this.defaultValue);
       this.currentLevel = i;
    }
    return value;
};

// ======================================================================
// Me object, a bus agent representing a local user (you actually!)
// ======================================================================

function Me(uid) {
    BusAgent.call(this, autobus, uid, BusAgent.prototype.HERE);
    this.setTags("intendee");
    this.ping = 0;
    this.activitySummary = new Summary(this, "activity", ["disconnected", "typing", "watching", "way"], "connected");
    this.awayAttractor = new Attractor(this.activitySummary, "away", 60000, true);
    this.typingAttractor = new Attractor(this.activitySummary, "typing", 5000, false);
    this.profileId = undefined;
}

Me.prototype = new BusAgent();

Me.prototype.init = function(profileId) {
    this.subscribe("profileId", this.onProfileId);
    this.subscribe("nickname", this.onNickname);
    this.subscribe("icon", this.onIcon);
    this.subscribe("mind", this.onMind);
    this.subscribe("emblem", this.onEmblem);
    this.subscribe("color", this.onColor);
    this.doPing();
    var self = this;
    setInterval(function() { self.doPing() }, 100 * 1000 - 20 * Math.random() * 1000);

    if (profileId) {
        this.setProfileId(profileId);
    } else // wait for few seconds to detect remote intendees and auto-configure
        setTimeout(function() { self.autoConfig(); }, 3 * 1000);   
};

Me.prototype.postMessage = function(content, icon, color) {
    var msg = new BusAgent(autobus, agentUUID("m"), BusAgent.prototype.HERE);
    msg.sets({
            tags: ["message", "messageOf" + this.name],
                from: this.name,
                icon: icon,
                color: color,
                //to: otherIntendee,
                content: content,
                timestamp: 1 + this.ping
                });

    autobus.tagsonomy.removeIn("here", msg); // to prevent advertising on /status/here
};

Me.prototype.doPing = function() {
    this.set("ping", 1 + this.ping);
};

var lastProfileId = null;
Me.prototype.onProfileId = function(variable, value) {
    if (!settings.exist(value) && lastProfileId)
        settings.duplicate(value, lastProfileId);

    lastProfileId = value;

    var expire = new Date();
    expire.setTime(expire.getTime() + 3600 * 24 * 1000 * 30);
    cookies.set("a2ac_id", this.name + "+" + value, expire);
}

Me.prototype.onNickname = function(variable, value) {
    settings.set(this.profileId, "nickname", value);
};

Me.prototype.onIcon = function(variable, value) {
    settings.set(this.profileId, "icon", value);
};

Me.prototype.onMind = function(variable, value) {
    settings.set(this.profileId, "mind", value);
};

Me.prototype.onEmblem = function(variable, value) {
    settings.set(this.profileId, "emblem", value);
};

Me.prototype.onColor = function(variable, value) {
    settings.set(this.profileId, "color", value);
};

Me.prototype.setProfileId = function(profileId, isNew) {
    this.set("profileId", profileId);
    if (isNew) return;

    var nickname = settings.get(profileId, "nickname") || '',
        icon = settings.get(profileId, "icon") || '',
        mind = settings.get(profileId, "mind") || '',
        emblem = settings.get(profileId, "emblem") || '',
        color = settings.get(profileId, "color") || '';

    this.set("nickname", nickname);
    this.set("icon", icon);
    this.set("mind", mind);
    this.set("emblem", emblem);
    this.set("color", color);
};

Me.prototype.autoConfig = function() {
    var profileId = cookies.get("a2ac_id");
    if (profileId) return; // already a non default settings

    // list known intendees names
    var names = [];
    var intendees = autobus.tagsonomy.getOr("intendee",[]);
    for (var l = intendees.length, i = l - 1; i >= 0; i--)
        names.push(intendees[i].nickname);
    
    // here is a default list of nickname
    var lst = [ "red", "blue", "green", "pink", "purple", "orange", "guest" ];
    var default_prefix = "guest";
    var nickname;

    // try to find a free nickname
    for (var l = lst.length, i = l - 1; i >= 0; i--) {
        if (names.indexOf(lst[i]) != -1) continue;
        nickname = lst[i];
    }   

    if (!nickname) { // no more free nickname, build a numbered one 
        var i = 2;
        while (names.indexOf(default_prefix + i) != -1) i++;
        nickname = default_prefix + i;
    }

    this.setProfileId(nickname);
};

// ======================================================================
// A2AC Application package (i.e. singleton)
// ======================================================================

var a2ac = {
    me: null,
    neighbourhood: null,
    //messagesQueue: [],

    pingsLog: {},
    lastPingsLog: {},

    cleanGone: function() {
        for (var lst = autobus.tagsonomy.getOr("intendee",[]), l = lst.length, i = l - 1; i >= 0; i--) {
            var intendee = lst[i];
            if (intendee === this.me || a2ac.pingsLog[intendee.name] || a2ac.lastPingsLog[intendee.name])
                continue; // intendee still here
            
            // intendee is gone
            log("intendee " + intendee.name + " is gone!");
            if (intendee.neighbour) {
              intendee.neighbour = false;
              a2ac.neighbourhood.removeIn("intendees", intendee);
            }
            intendee.forget();
        }
        
        a2ac.lastPingsLog = a2ac.pingsLog;
        a2ac.pingsLog = {};
    },

    onIntendeePing: function(variable, value) {
        a2ac.pingsLog[this.name] = this;
        log("intendee " + this.name + " heard at " + new Date());
        if (a2ac.me.ping < value) a2ac.me.ping = value;
    },

    onIntendeeActivity: function(variable, value) {
        if (value == 'disconnected') {
            if (this.neighbour) {
              this.neighbour = false;
              a2ac.neighbourhood.removeIn("intendees", this);
            }
        } else if (!this.neighbour) {
            this.neighbour = true;
            a2ac.neighbourhood.unshiftIn("intendees", this);
        }
    },

    onMessageTimestamp: function(variable, value) {
        if (a2ac.me.ping < value) a2ac.me.ping = value;
        if (value && !this.neighbour) {
          this.neighbour = true;
          var a = a2ac.neighbourhood.messages;
          for (var i = 0 ; i < a.length ; i++) {
            var m = a[i];
            if (m.timestamp < value) break;
          }
          a2ac.neighbourhood.spliceIn("messages", i, 0, this);
        }
    },

    onIntendeesSplice: function(tag, index, howMany /*, intendee, intendee ... */) {
       var args = Array.prototype.slice.call(arguments,1);
       for (var j = 2; j < args.length; j++) {
           var intendee = args[j];
           log("new intendee id " + intendee.name);
           intendee.subscribeSync("ping", a2ac.onIntendeePing);
           intendee.subscribeSync("activity", a2ac.onIntendeeActivity);
       }
    },

    onMessagesSplice: function(tag, index, howMany /*, message, message ... */) {
        for (var j = 3; j < arguments.length; j++) { 
            var message = arguments[j];
            //log("new message " + message.name);
            message.subscribeSync("timestamp", a2ac.onMessageTimestamp);
            //a2ac.messagesQueue.unshift(message);
            
            // var removed = a2ac.messagesQueue.splice(10,10);
            // TO BE DONE: revoir la gestion des indices lors de cette manip de liste *rééntrante*
            //for (var lst = removed, l = lst.length, i = l - 1; i >= 0; i--) {
            //    //log("message " + lst[i].name + " forgotten");
            //    lst[i].forget();
            // }
        }
    },

    loadLog: function(jsonLog) {
      var freeds = [];
      if (!jsonLog || jsonLog.charAt(0) != "[") {
        console.log("not a log : " + jsonLog);
        return;
      }
      var log = eval(jsonLog);
      for (var i = 0; i < log.length; i++) {
         var event = log[i];
         if (!event) break;
         var label = event.label;
         if (autobus.agora) label = label.substring(label.indexOf('/') + 1);
         if (label.substring(0, 6) == "freed") {
            freeds.push(label.substring(6));
         } else if (label.substring(0,6) == "model/") {
            var slashIdx = label.indexOf("/", 6);
            var agentName = slashIdx != -1 ? label.substring(6, slashIdx) : label.substring(6);
            var slot = slashIdx != -1 ? label.substring(slashIdx + 1) : undefined;
            if (freeds.indexOf(agentName) == -1) {
               obj = autobus.busAgent(agentName, BusAgent.prototype.THERE);
               if (obj.there()) {
                  if (slot) {
                     value = eval("(" + event.body + ")");
                     if (obj[slot] === undefined)
                        obj.setted(slot, value); 
                  } else {
                     delta = eval("(" + event.body + ")");
                     for (var slot in delta) {
                        if (!delta.hasOwnProperty(slot)) continue;
                        if (obj[slot] !== undefined) continue;
                        obj.setted(slot, delta[slot]);
                     }
                  }
               }
            }
         } 
      }
    },

    retrieveLog: function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/a2a_chat/bots/getlog.cgi", true);
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.onreadystatechange = function() {
           if (xhr.readyState >= 4) {
               a2ac.loadLog(xhr.responseText);
           }
        }
        xhr.send("");
    },
    
    init: function() {
        settings.init("a2ac", default_profiles);

        this.neighbourhood = new PubSubAgent();
        this.neighbourhood.intendees = [];
        this.neighbourhood.messages = [];

        autobus.tagsonomy.subscribe("intendee", a2ac.onIntendeesSplice);
        autobus.tagsonomy.subscribe("message", a2ac.onMessagesSplice);
        autobus.init();
        
        var uIDnProf = cookies.get("a2ac_id");
        var t = uIDnProf ? uIDnProf.split("+") : [];
        var meUID = t.length ? t[0] : agentUUID("i");
        var profileID = t.length > 1 ? t[1] : null;
        a2ac.me = new Me(meUID);
        a2ac.me.init(profileID);
        a2ac.retrieveLog();
        setInterval(a2ac.cleanGone, 60 * 2 * 1000);
    },

    finalize: function() {
        a2ac.me.activitySummary.set("disconnected", true);
        a2ac.me.tell();
    },

    reset: function() {
        settings.reset();
        cookies.set("a2ac_id", "");
        a2ac.me.set('name', agentUUID("i"));
        a2ac.me.autoConfig();
    }
};


