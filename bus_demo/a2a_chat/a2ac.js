// ======================================================================
// A2A Chat application core
// ======================================================================
const autobus = Autobus.factory();

// ======================================================================
// helpers
// ======================================================================
const log = window.console.log;

if (0)
    autobus.hbc.logCB = function (msg) {
        puts("logCB: " + msg);
    };


const colors = [ 'red', 'blue', 'green', 'pink', 'violet', 'indigo', 'orange'] ;
// ======================================================================
// Default profiles of settings
// ======================================================================
const default_profiles = {
    red: {
        nickname: generateName('red'),
        icon: "./images/person.svg",
        mind: "happy",
        color: "red",
        emblem: ""
    },
    blue: {
        nickname: generateName('blue'),
        icon: "./images/person.svg",
        mind: "cool",
        color: "blue",
        emblem: ""
    },
    green: {
        nickname: generateName('green'),
        icon: "./images/person.svg",
        mind: "watchful",
        color: "green",
        emblem: ""
    },
    pink: {
        nickname: generateName('pink'),
        icon: "./images/person.svg",
        mind: "groovy",
        color: "pink",
        emblem: ""
    },
    violet: {
        nickname: generateName('violet'),
        icon: "./images/person.svg",
        mind: "zen",
        color: "violet",
        emblem: ""
    },
    indigo: {
        nickname: generateName('indigo'),
        icon: "./images/person.svg",
        mind: "zen",
        color: "indigo",
        emblem: ""
    },
    orange: {
        nickname: generateName('orange'),
        icon: "./images/person.svg",
        mind: "open",
        color: "orange",
        emblem: ""
    }
};

let iColor = 0;
function generateName(colorId /* red */) {
    const colors = {
        red: "rouge", blue: "bleu", green: "vert",
        pink: "rose", violet: "violet",
        indigo: "indigo", orange: "orange"
    };
    colorId = colorId || colors[(iColor++) % colors.length];
    const n1 = ["Écureuil", "Girafon", "Lion", "Oiseau", "Requin", "Singe", "Tigre", "Ours",
    "Kangourou", "Loup", "Renard", "Cobra", 
    "Dauphin", " Éléphant", "Hippo", "Iguane", "Jaguar", "Koala", "Lémurien", "Nudibranche",
    "Panda", "Quokka", "Renne", "Singe", "Bison", "Yack", "Zèbre"];
	const n2 = ["capable", "absolu", "adorable", "aventureux", "académique",
    "accompli", "exact", "acide", "acrobatique", "actif", "compétent", "admirable",
    "apprécié", "charmant", "avancé", "affectueux", "agile", "agité", 
    "agréable", "ouvert", "alarmé", "inquiétant", "alerte", "vivant", "altruiste",
    "étonnant", "ambitieux", "amusé", "drôle", "angélique", "en colère", "tourmenté",
    "animé", "annuel", "anxieux", "attentionné", "arctique",
    "parfumé", "artistique", "athlétique", "attaché", "attentif", "attrayant",
    "authentique", "conscient", "incroyable", "écologique",
    "dangereux", "soigné", "calme", "honnête", "heureux", "chaud", "coopératif",
    "coordonné", "courageux", "courtois", "habile", "fou", "froid",
    "créatif", "effrayant", "exigeant", "fiable", "indépendant", "résolu", "dévoué", "différent",
    "numérique", "loyal", "complet", "complexe", "composé", "préoccupé", "confus",
    "tendre", "étourdi", "direct", "désastreux", "discret", "sombre", "lointain",
    "sec", "dual", "diligent", "désireux", "sérieux", "précoce", "facile à vivre", "euphorique",
    "instruit", "élaboré", "élastique", "électrique", "élégant", "élémentaire",
    "embarrassé", "embelli", "éminent", "émotif", "enchanté", "énergique", "éclairé", 
    "enragé", "entier", "estimé", "moral", "éternel", "exalté", "exemplaire", "excité",
    "expérimenté", "fabuleux", "malin"];
    return (
        n1[parseInt(Math.random() * n1.length)] + ' '  +
        colors[colorId] + ' ' +
        n2[parseInt(Math.random() * n2.length)]);
}

// ======================================================================
// Settings Managing package
// ======================================================================

const settings = {
    storageName: null,
    current: null,
    saveTask: undefined,

    init: function (cookieName) {
        this.cookieName = cookieName;
        this.load();
    },

    load: function () {
        if (this.current === null) {
            try {
                this.current = JSON.parse(localStorage.getItem(this.storageName) || "{}");
            } catch (e) {
                console.log(e);
            }
        }
        return this.current;
    },

    doSave: function () {
        localStorage.setItem(this.storageName, JSON.stringify(this.current));
        this.saveTask = undefined;
    },

    save: function () { // actually data changes are gathered via a small delay to enhance perfs
        if (this.saveTask !== undefined) return; // already schedulled
        // note the delay amount hereafter is irrevelant, the idea is just to update the cookie only once by set() salve
        this.saveTask = setTimeout(() => this.doSave(), 500);
    },

    set: function (variable, value) {
        if (value === this.current[variable]) return; // nothing new here
        this.current[variable] = value;
        this.save();
    },

    reset: function () {
        this.current = { profileId: a2ac.me.profileId };
        this.doSave();
    }
};

// ======================================================================
// Attractor : accessor proxy which set backs a targeted variable to a
// default value after a delay.
// ======================================================================

function Attractor(state, variable, delay, defaultValue) {
    this.state = state;
    this.variable = variable;
    this.delay = delay;
    this.timeout = undefined;
    this.defaultValue = defaultValue;
    let self = this;
    this.cb = function () {
        self.timeout = undefined;
        self.state.set(self.variable, self.defaultValue);
    };
}

Attractor.prototype.set = function (variable, value) {
    this.state.set(variable, value);
    if (variable !== this.variable) return value;
    if (this.timeout !== undefined) clearTimeout(this.timeout);
    if (value !== this.defaultValue) {
        this.timeout = setTimeout(this.cb, this.delay);
    }
    return value;
};

// ======================================================================
// Summary : accessor proxy which determines the first variable
// equals to true in an ordered list of boolean variables and set a target
// variable to this variable name.
// ======================================================================

function Summary(state, variable, levels, defaultValue) {
    this.state = state;
    this.variable = variable;
    this.levels = levels;
    this.defaultValue = defaultValue;
    this.status = new Set([]);
    this.currentLevel = levels.length;
    state.set(variable, defaultValue);
}

Summary.prototype.set = function (variable, value) {
    let i = this.levels.indexOf(variable);
    if (i === -1) return value;
    if (value) {
        if (this.status.has(variable)) return;
        this.status.add(variable);
    } else {
        if (!this.status.has(variable)) return;
        this.status.delete(variable);
    }
    let firstLevel = this.levels.find(l => this.status.has(l));
    this.state.set(this.variable, firstLevel || this.defaultValue);
    return value;
};

// ======================================================================
// Me object, a bus agent representing a local user (you actually!)
// ======================================================================

function Me(uid) {
    BusState.call(this, autobus, uid, BusState.prototype.HERE);
    this.setTags("intendee");
    this.timestamp = 0;
    this.activitySummary = new Summary(this, "activity", ["disconnected", "typing", "watching", "way"], "connected");
    this.awayAttractor = new Attractor(this.activitySummary, "away", 60000, true);
    this.typingAttractor = new Attractor(this.activitySummary, "typing", 5000, false);
}

Me.prototype = new BusState();

Me.prototype.init = function () {
    this.subscribe("nickname", this.onNickname);
    this.subscribe("icon", this.onIcon);
    this.subscribe("mind", this.onMind);
    this.subscribe("emblem", this.onEmblem);
    this.subscribe("color", this.onColor);
    this.doPing();

    if (!this.loadProfile()) {
        // wait for few seconds to detect remote intendees and auto-configure
        setTimeout(() => {
            this.autoConfig();
            this.doPing();
        }, 1000);
    } else {
        this.doPing();
    }
    setInterval(() => this.doPing(), 100 * 1000 - 20 * Math.random() * 1000);
};

Me.prototype.postMessage = function (content, icon, color) {
    let msg = new BusState(autobus, stateUUID("m"), BusState.prototype.HERE);
    msg.sets({
        from: this.name,
        date: new Date().toISOString().slice(0, 19).replace("T", " "),
        icon: icon,
        color: color,
        //to: otherIntendee,
        content: content,
        timestamp: 1 + this.timestamp,
        tags: ["message", "messageFrom." + this.name]
    });
    autobus.tagsonomy.removeIn("here", msg); // to prevent advertising on /status/here
};

Me.prototype.doPing = function () {
    this.set("timestamp", 1 + this.timestamp);
};

Me.prototype.onNickname = function (variable, value) {
    settings.set("nickname", value);
};

Me.prototype.onIcon = function (variable, value) {
    settings.set("icon", value);
};

Me.prototype.onMind = function (variable, value) {
    settings.set("mind", value);
};

Me.prototype.onEmblem = function (variable, value) {
    settings.set("emblem", value);
};

Me.prototype.onColor = function (variable, value) {
    settings.set("color", value);
};

Me.prototype.loadProfile = function () {
    let current = settings.load();
    if (!current.profileId) return false;
    let profile = default_profiles[current.profileId];
    this.set("nickname", current.nickname || profile.nickname);
    this.set("icon", current.icon || profile.icon);
    this.set("mind", current.mind || profile.mind);
    this.set("emblem", current.emblem || profile.emblem);
    this.set("color", current.color || profile.color);
    return true;
};

Me.prototype.autoConfig = function () {
    let intendeeIds = autobus.tagsonomy.getOr("intendee", []).map(i => i.color);
    let colorId = parseInt(Math.random() * colors.length);
    offset = 0;
    while(offset < colors.length && intendeeIds.indexOf(colors[(offset + colorId) % colors.length]) !== -1) {
        offset++;
    }
    profileId = colors[(offset + colorId) % colors.length];
    this.profileId = profileId;
    settings.set("profileId", profileId);
    this.loadProfile();
};

// ======================================================================
// A2AC Application package (i.e. singleton)
// ======================================================================

const a2ac = {
    me: null,
    neighbourhood: null,
    //messagesQueue: [],

    pingsLog: {},
    lastPingsLog: {},

    cleanGone: function () {
        autobus.tagsonomy.getOr("intendee", []).forEach(intendee => {
            if (intendee === this.me || a2ac.pingsLog[intendee.name] || a2ac.lastPingsLog[intendee.name])
                return; // intendee still here

            // intendee is gone
            log("intendee " + intendee.name + " is gone!");
            if (intendee.neighbour) {
                intendee.neighbour = false;
                a2ac.neighbourhood.removeIn("intendees", intendee);
            }
            intendee.forget();
        });

        a2ac.lastPingsLog = a2ac.pingsLog;
        a2ac.pingsLog = {};
    },

    onIntendeeTimestamp: function (variable, value) {
        let intendee = this;
        a2ac.pingsLog[intendee.name] = this;
        log("intendee " + intendee.name + " heard at " + new Date().toISOString().slice(0, 19).replace("T", " "));
        if (a2ac.me.timestamp < Number(value)) a2ac.me.timestamp = Number(value);
    },

    onIntendeeActivity: function (variable, value) {
        let intendee = this;
        a2ac.pingsLog[intendee.name] = this;
        if (value === 'disconnected') {
            if (intendee.neighbour) {
                intendee.neighbour = false;
                a2ac.neighbourhood.removeIn("intendees", intendee);
            }
        } else if (intendee !== a2ac.me && !intendee.neighbour) {
            intendee.neighbour = true;
            a2ac.neighbourhood.unshiftIn("intendees", intendee);
        }
    },

    onIntendeesSplice: function (tag, index, howMany, ...added) {
        for (let j = index; j < index + howMany; j++) {
            a2ac.neighbourhood.removeIn("intendees", autobus.tagsonomy.intendee[j]);
        }
        added.forEach((intendee) => {
            log("new intendee id " + intendee.name);
            if (intendee.timestamp && !intendee.neighbour) {
                intendee.neighbour = true;
                if (intendee.activity !== 'disconnected') {
                    let a = a2ac.neighbourhood.intendees;
                    let i = 0;
                    while (i < a.length && Number(a[i].timestamp) >= Number(intendee.timestamp)) {
                        i++;
                    }
                    a2ac.neighbourhood.spliceIn("intendees", i, 0, intendee);
                }
            }
            intendee.subscribeSync("timestamp", a2ac.onIntendeeTimestamp);
            intendee.subscribeSync("activity", a2ac.onIntendeeActivity);
        });
    },

    onMessagesSplice: function (tag, index, howMany, ...added) {
        added.forEach(message => {
            if (a2ac.me.timestamp < Number(message.timestamp))
                a2ac.me.timestamp = Number(message.timestamp);
            if (message.timestamp && !message.neighbour) {
                message.neighbour = true;
                let a = a2ac.neighbourhood.messages;
                let i = 0;
                while (i < a.length && Number(a[i].timestamp) >= Number(message.timestamp)) {
                    i++;
                }
                a2ac.neighbourhood.spliceIn("messages", i, 0, message);
            }
        });
        // let t = [...autobus.tagsonomy['message']].sort((a, b) => a.timestamp - b.timestamp);
    },

    loadLog: function (jsonLog) {
        let freeds = {};
        if (!jsonLog || jsonLog.charAt(0) != "[") {
            console.log("not a log : " + jsonLog);
            return;
        }
        let log = JSON.parse(jsonLog);
        let currentDate = new Date();
        log.reverse();
        for (let i = 0; i < log.length; i++) {
            let event = log[i];
            if (!event) break;
            let timestamp = new Date(event.timestamp);
            let minute = Math.fround((currentDate - timestamp) / 1000 / 60, 1);
            // console.log(event.label, '@', minute);
            if (minute > 90) continue;

            let label = event.label;
            if (autobus.agora) {
                let agora = label.substring(0, label.indexOf('/') + 1);
                if (agora != autobus.agora) continue;
                label = label.substring(label.indexOf('/') + 1);
            }
            if (label.substring(0, 6) == "freed") {
                freeds[label.substring(7)] = true;
            } else if (label.substring(0, 6) == "model/") {
                let slashIdx = label.indexOf("/", 6);
                let stateName = slashIdx !== -1 ? label.substring(6, slashIdx) : label.substring(6);
                let slot = slashIdx !== -1 ? label.substring(slashIdx + 1) : undefined;
                if (!freeds[stateName]) {
                    let obj = autobus.busState(stateName, BusState.prototype.THERE);
                    if (obj.there()) {
                        let body = JSON.parse(event.body);
                        if (slot) {
                            if (!(slot in obj))
                                obj.setted(slot, body);
                        } else {
                            Object.entries(body).forEach(([key, value]) => {
                                if (key in obj || key === 'tags') return;
                                obj.setted(key, value)
                            });
                            if (body.tags) {
                                obj.setted("tags", body.tags);
                            }
                        }
                    }
                }
            }
        }
    },

    retrieveLog: function () {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "/bots/getlog.cgi", true);
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.onreadystatechange = function () {
            xhr.readyState >= 4 && a2ac.loadLog(xhr.responseText);
        }
        xhr.send("");
    },

    init: function () {
        settings.init("a2ac");

        this.neighbourhood = new PubSubState();
        this.neighbourhood.intendees = [];
        this.neighbourhood.messages = [];

        autobus.tagsonomy.subscribeSync("intendee", a2ac.onIntendeesSplice);
        autobus.tagsonomy.subscribeSync("message", a2ac.onMessagesSplice);
        autobus.init();

        let meUID = localStorage.getItem("a2ac_id") || stateUUID("i");
        localStorage.setItem("a2ac_id", meUID);
        a2ac.me = new Me(meUID);
        a2ac.me.init();
        a2ac.retrieveLog();
        setInterval(a2ac.cleanGone, 60 * 2 * 1000);
    },

    finalize: function () {
        a2ac.me.activitySummary.set("disconnected", true);
        a2ac.me.tell();
    },

    reset: function () {
        settings.reset();
        a2ac.me.loadProfile();
    }
};
