
var autobus = new Autobus();
var me;

function log(msg) {
    return;
    puts(msg);
}


if(0)
    autobus.hbc.logCB = function(msg) {
        puts("logCB: " + msg) ;
    };

var pingsLog = {};
function onIntendeePing(intendee, variable, value) {
    pingsLog[intendee.name] = intendee;
    log("intendee " + intendee.name + " heard at " + new Date());
    if (me.ping < value) me.ping = value;
}

var default_settings = {
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


var settings = {
    cookieName: null,
    initial: null,
    current: null,
    saveTask: undefined,

    init: function(cookieName, default_settings) {
        this.cookieName = cookieName;
        this.initial = this.current = default_settings || {};
        this.load();
    },

    load: function() {
        var restored = eval("(" + (cookies.get(this.cookieName) || "null") + ")");
        if (restored) this.current = restored;
    },
    
    doSave: function() {
        var expire = new Date();
        expire.setTime(expire.getTime() + 3600 * 24 * 100);
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
}

function onIntendeesSplice(tag, index, howMany /*, intendee, intendee ... */) {
                  
    var args = Array.prototype.slice.call(arguments,1);

    for (var j = 2; j < args.length; j++) {
        var intendee = args[j];
        log("new intendee id " + intendee.name);
        intendee.subscribe("ping", onIntendeePing);
    }
    if (args.length > 2)
        sound.play("incoming", 5000);
    if (howMany)
        sound.play("leaving", 5000);

    revolutionOfIntendees.splice.apply(revolutionOfIntendees,args);
}


function onMessageContent(message, variable, value) {
    var intendee = autobus.tagsonomy.getOr(message.from,null);
    var who = (intendee && intendee.nickname ? intendee.nickname : "intendee " + message.from);
    //log(who + " said: " + value);
    if (me.looking || me.typing) return; // no need to make sound if me looking
    sound.play("blah!", 5000);
}

function onMessageTimestamp(message, variable, value) {
    if (me.ping < value) me.ping = value;
}

var messagesQueue = [];

function onMessagesSplice(tag, index, howMany /*, message, message ... */) {
    for (var j = 3; j < arguments.length; j++) { 
        var message = arguments[j];
        //log("new message " + message.name);
        message.subscribe("content", onMessageContent);
        message.subscribe("timestamp", onMessageTimestamp);
        messagesQueue.unshift(message);
        revolutionOfMessages.unshift(message);

        var removed = messagesQueue.splice(10,10);
        for (var lst = removed, l = lst.length, i = l - 1; i >= 0; i--) {
            //log("message " + lst[i].name + " forgotten");
            lst[i].forget();
        } }
}


function Me() {
    BusAgent.call(this, autobus, agentUUID("i"), BusAgent.prototype.here);
    this.setTags("intendee");
    this.ping = 0;
}

Me.prototype = new BusAgent();
Me.prototype.postMessage = function() {
    v = document.getElementById('messageBody');
    var msg = new BusAgent(autobus, agentUUID("m"), BusAgent.prototype.here);
    msg.sets({
            tags: ["message"],
                from: me.name,
                //to: otherIntendee,
                content: v.value,
                timestamp: 1 + me.ping
                });
    v.value = "";
};

Me.prototype.doPing = function() {
    this.set("ping", 1 + me.ping);
}

        var lastPingsLog = {};
function cleanGone() {
    for (var lst = autobus.tagsonomy.getOr("intendee",[]), l = lst.length, i = l - 1; i >= 0; i--) {
        var intendee=lst[i];
        if (intendee === me || pingsLog[intendee.name] || lastPingsLog[intendee.name])
            continue; // intendee still here

        // intendee is gone
        log("intendee " + intendee.name + " is gone!");
        intendee.forget();
    }

    lastPingsLog = pingsLog;
    pingsLog = {};
}

function onMeNickname(me, variable, value) {
    document.getElementById("meName").value = value;
    cookies.set("a2ac_nickname", value);
}

function onMeIcon(me, variable, value) {
    document.getElementById("mePic").value = value;
    document.getElementById("mePicImg").src = value;
    settings.set(me.nickname, "icon", value);
}

function onMeMind(me, variable, value) {
    document.getElementById("meMind").value = value;
    settings.set(me.nickname, "mind", value);
}

function onMeEmblem(me, variable, value) {
    document.getElementById("meEmblem").value = value;
    document.getElementById("meEmblemImg").src = value;
    settings.set(me.nickname, "emblem", value);
}

var awayTimeout = null;

function onMeWorking(me, variable, value) {
    if (me.awayTimeout !== undefined) {
        clearTimeout(me.awayTimeout);
        me.awayTimeout = undefined;
    }
    if (value)
        me.set("away", false);
    else if (!me.get("looking") && !me.get("typing")) // not working any more
        me.awayTimeout = setTimeout(function() {me.set("away" ,true);}, 60 * 1000);
}



function setNickname(nickname) {
    me.set("nickname", nickname);
    var icon = settings.get(nickname, "icon") || "./sexy_gui/images/guest.gif",
        mind = settings.get(nickname, "mind") || "",
        emblem = settings.get(nickname, "emblem");

    icon && me.set("icon", icon);
    mind && me.set("mind", mind);
    emblem && me.set("emblem", emblem);
}

function autoConfig() {
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

    setNickname(nickname);
}

function meInit() {
    me = new Me();
    me.doPing();
    setInterval(function() { me.doPing() }, 60 * 2 * 1000 - 30 * Math.random() * 1000);
}

function init() {
    settings.init("a2ac", default_settings);

    uiInit();

    autobus.tagsonomy.subscribe("intendee", onIntendeesSplice);
    autobus.tagsonomy.subscribe("message", onMessagesSplice);

    autobus.init();
    meInit();
    me.subscribe("nickname", onMeNickname);
    me.subscribe("icon", onMeIcon);
    me.subscribe("mind", onMeMind);
    me.subscribe("emblem", onMeEmblem);
    me.subscribe("looking", onMeWorking);
    me.subscribe("typing", onMeWorking);

    setInterval(cleanGone, 60 * 2 * 1000);
    var nickname = cookies.get("a2ac_nickname");

    if (nickname)
        setNickname(nickname);
    else // wait for few seconds to detect remote intendees and auto-configure
        setTimeout(autoConfig, 3 * 1000);   
}

function finish() {
    me.forget();
}

