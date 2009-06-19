// ======================================================================
// A2A Chat application core
// ======================================================================

var autobus = new Autobus();

// ======================================================================
// helpers
// ======================================================================
function log(msg) {
    console.log(msg);
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
        icon: "./sexy_gui/images/red.gif",
        mind: "happy"
    },
    blue: {
        icon: "./sexy_gui/images/blue.gif",
        mind: "cool"
    },
    green: {
        icon: "./sexy_gui/images/green.gif",
        mind: "watchful"
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
        this.initial = this.current = default_profiles || {};
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

    set: function(key, variable, value) {
        if (value == this.get(key, variable)) return; // nothing new here

        var c = this.current[key];
        if (!c) c = this.current[key] = {};
        c[variable] = value;
        
        this.save();
    },

    get: function(key, variable) {
        var c = this.current[key];
        return c ? c[variable] : c;
    }
};

// ======================================================================
// Activity object = agent boolean variable manager with sligh positive hysteris 
// ======================================================================

function Activity(agent, action, delay) {
    this.agent = agent;
    this.action = action;
    this.timeout = undefined;
    this.now = false;
    this.delay = delay || 500;
    agent.set(action, false);
    var self = this;
    this.cb = function () {
        self.timeout = undefined ;
        agent.set(self.action, self.now);
    };  
}

Activity.prototype.set = function(value) {
    if (this.timeout !== undefined) clearTimeout(this.timeout) ;
    this.now = value;
    if (value) {
        this.timeout = undefined ;
        this.agent.set(this.action, true);
    } else
        this.timeout = setTimeout(this.cb, this.delay);
};

// ======================================================================
// Me object, a bus agent representing a local user (you actually!)
// ======================================================================

function Me() {
    BusAgent.call(this, autobus, agentUUID("i"), BusAgent.prototype.here);
    this.setTags("intendee");
    this.ping = 0;
    this.awayTimeout = undefined;
    this.typingActivity = new Activity(this, "typing", 5000);
    this.watchingActivity = new Activity(this, "watching", 5000);
}

Me.prototype = new BusAgent();

Me.prototype.init = function() {
    this.subscribe("nickname", this.onNickname);
    this.subscribe("icon", this.onIcon);
    this.subscribe("mind", this.onMind);
    this.subscribe("emblem", this.onEmblem);
    this.subscribe("watching", this.onWorking);
    this.subscribe("typing", this.onWorking);
    this.doPing();
    var self = this;
    setInterval(function() { self.doPing() }, 60 * 2 * 1000 - 30 * Math.random() * 1000);

    var nickname = cookies.get("a2ac_nickname");
    if (nickname)
        this.setNickname(nickname);
    else // wait for few seconds to detect remote intendees and auto-configure
        setTimeout(function() { self.autoConfig(); }, 3 * 1000);   
};

Me.prototype.postMessage = function(content) {
    var msg = new BusAgent(autobus, agentUUID("m"), BusAgent.prototype.here);
    msg.sets({
            tags: ["message"],
                from: this.name,
                //to: otherIntendee,
                content: content,
                timestamp: 1 + this.ping
                });
};

Me.prototype.doPing = function() {
    this.set("ping", 1 + this.ping);
};

Me.prototype.onNickname = function(variable, value) {
    var expire = new Date();
    expire.setTime(expire.getTime() + 3600 * 24 * 1000 * 30);
    cookies.set("a2ac_nickname", value);
};

Me.prototype.onIcon = function(variable, value) {
    settings.set(this.nickname, "icon", value);
};

Me.prototype.onMind = function(variable, value) {
    settings.set(this.nickname, "mind", value);
};

Me.prototype.onEmblem = function(variable, value) {
    settings.set(this.nickname, "emblem", value);
};

Me.prototype.onWorking = function(variable, value) {
    if (this.awayTimeout !== undefined) {
        clearTimeout(this.awayTimeout);
        this.awayTimeout = undefined;
    }
    if (value)
        this.set("away", false);
    else if (!this.get("watching") && !this.get("typing")) { // not working any more
        var self = this;
        this.awayTimeout = setTimeout(function() {self.set("away" ,true);}, 60 * 1000);
    }
};

Me.prototype.setNickname = function(nickname) {
    this.set("nickname", nickname);
    var icon = settings.get(nickname, "icon") || "./sexy_gui/images/guest.gif",
        mind = settings.get(nickname, "mind") || "",
        emblem = settings.get(nickname, "emblem");

    icon && this.set("icon", icon);
    mind && this.set("mind", mind);
    emblem && this.set("emblem", emblem);
};

Me.prototype.autoConfig = function() {
    var nickname = cookies.get("a2ac_nickname");
    if (nickname) return; // already a non default settings

    // list known intendees name
    var names = [];
    var intendees = autobus.tagsonomy.getOr("intendee",[]);
    for (var l = intendees.length, i = l - 1; i >= 0; i--)
        names.push(intendees[i].nickname);
    
    // here is a default list of nickname
    var lst = [ "red", "blue", "green", "purple", "orange", "pink", "gray", "guest" ];

    // try to find a free nickname
    for (var l = lst.length, i = l - 1; i >= 0; i--) {
        if (names.indexOf(lst[i]) != -1) continue;
        nickname = lst[i];
    }   

    if (!nickname) { // no more free nickname, build a numbered one 
        var default_prefix = "guest";
        var i = 2;
        while (names.indexOf(default_prefix + i) != -1) i++;
        nickname = default_prefix + i;
    }

    this.setNickname(nickname);
};

// ======================================================================
// A2AC Application package (i.e. singleton)
// ======================================================================

var a2ac = {
    me: null,

    messagesQueue: [],

    pingsLog: {},
    lastPingsLog: {},

    cleanGone: function() {
        for (var lst = autobus.tagsonomy.getOr("intendee",[]), l = lst.length, i = l - 1; i >= 0; i--) {
            var intendee=lst[i];
            if (intendee === this.me || a2ac.pingsLog[intendee.name] || a2ac.lastPingsLog[intendee.name])
                continue; // intendee still here
            
            // intendee is gone
            log("intendee " + intendee.name + " is gone!");
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

    onMessageTimestamp: function(variable, value) {
        if (a2ac.me.ping < value) a2ac.me.ping = value;
    },

    onIntendeesSplice: function(tag, index, howMany /*, intendee, intendee ... */) {
       var args = Array.prototype.slice.call(arguments,1);
       for (var j = 2; j < args.length; j++) {
           var intendee = args[j];
           log("new intendee id " + intendee.name);
           intendee.subscribe("ping", a2ac.onIntendeePing);
       }
    },

    onMessagesSplice: function(tag, index, howMany /*, message, message ... */) {
        for (var j = 3; j < arguments.length; j++) { 
            var message = arguments[j];
            //log("new message " + message.name);
            message.subscribe("timestamp", a2ac.onMessageTimestamp);
            a2ac.messagesQueue.unshift(message);
            
            var removed = a2ac.messagesQueue.splice(10,10);
            // TO BE DONE: revoir la gestion des indices lors de cette manip de liste *rééntrante*
            for (var lst = removed, l = lst.length, i = l - 1; i >= 0; i--) {
                //log("message " + lst[i].name + " forgotten");
                lst[i].forget();
            } }
    },
    
    init: function() {
        settings.init("a2ac", default_profiles);

        autobus.tagsonomy.subscribe("intendee", a2ac.onIntendeesSplice);
        autobus.tagsonomy.subscribe("message", a2ac.onMessagesSplice);
        autobus.init();

        this.me = new Me();
        this.me.init();

        setInterval(a2ac.cleanGone, 60 * 2 * 1000);
    },

    finalize: function() {
        this.me.forget();
    }
};


