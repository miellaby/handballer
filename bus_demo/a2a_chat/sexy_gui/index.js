// ======================================================================
// Javascript glue for index.html
// ======================================================================


IntendeeCell.prototype.onClick = function () {
    chat2.showContextForm(this);
}

MessageCell.prototype.onClick = function () {
       chat2.showContextForm(this);
}

function contextFormAnimIterate() {
    writeDOM(this.form, this.current);
    this.ratio += 0.1;
    this.current.x = this.start.x + (this.end.x - this.start.x) * this.ratio;
    this.current.y = this.start.y + (this.end.y - this.start.y) * this.ratio;
    this.current.w = this.start.w + (this.end.w - this.start.w) * this.ratio;
    this.current.h = this.start.h + (this.end.h - this.start.h) * this.ratio;
    return this.ratio <= 1;
}

function puts(msg, pic, color) {
    chat2.revolutionOfMessages && chat2.revolutionOfMessages.unshift({ "from": "code", "content": msg, "icon": pic, "color": color || "purple" });
}

// ****************************************
// The main application logic : chat2
// ****************************************
var chat2 = {
    context: null,
    contextForm: null,
    revolutionOfIntendees: new Revolution(),
    revolutionOfMessages: new Revolution(),
    revolutionOfEvents: new Revolution(),
    intendeesGlider: new Glider(),
    messagesGlider: new Glider(),
    iTrap: new Trap(),
    mTrap: new Trap(),
    msgPic: null,
    msgColor: null,
    creole: new Parse.Simple.Creole({
        forIE: document.all,
        interwiki: {
            WikiCreole: 'http://www.wikicreole.org/wiki/',
            Wikipedia: 'http://en.wikipedia.org/wiki/'
        },
        linkFormat: ''
    }),
    incomingSound: new Audio('sound/freesound__soaper__footsteps_1.mp3'),
    leavingSound: new Audio('sound/freesound__FreqMan__011_Door_opens_and_shuts.mp3'),
    speakingSound: new Audio('sound/freesound__acclivity__Goblet_G_Medium.mp3'),
    history: [],
    historyIndex: -1,
    onIntendeesSplice: function (tag, index, howMany /*, intendee, intendee ... */) {
        //console.log(arguments);
        let args = Array.prototype.slice.call(arguments, 1);
        let sound = args.length > 2 ? chat2.incomingSound : chat2.leavingSound;
        sound.play().catch(e => { console.log(e) });
        chat2.revolutionOfIntendees.splice.apply(chat2.revolutionOfIntendees, args);
    },

    onMessagesSplice: function (tag, index, howMany /*, message, message ... */) {
        var args = Array.prototype.slice.call(arguments, 1);

        if (arguments.length > 3 && a2ac.me.activity == 'away') {
            // need to make sound if away
            chat2.speakingSound.play().catch(e => { console.log(e) });
        }

        // for (var i = index, n = index + howMany; i < index; i++) {
        //     var o = t.items.indexOf(a2ac.intendees[i]);
        //     t = t.filter(e => e !== o);
        // }

        chat2.revolutionOfMessages.splice.apply(chat2.revolutionOfMessages, args);
        if (chat2.revolutionOfMessages.n > 0) {
            args.shift();
            args.shift();
            args.forEach(newItem => chat2.advertiseMessage(newItem));
        }
    },

    onMessageSubmit: function () {
        var v = document.getElementById('messageBody').value;
        if (!v) return;      
        a2ac.me.postMessage(v, a2ac.me.icon, a2ac.me.color);
        chat2.history.unshift(v);
        chat2.history.length = 100;
        chat2.historyIndex = -1;
        document.getElementById('messageBody').value = "";
    },

    onMeNickname: function (variable, value) {
        var e = document.getElementsByName("meNickname")[0];
        e.defaultValue = e.value = value;
        document.getElementById("messageBody").placeholder = value;
    },

    onMeIcon: function (variable, value) {
        var e = document.getElementsByName("mePic")[0];
        e.defaultValue = e.value = value;
        value && imgBoxURL(document.getElementById("mePicImg"), value, 99, 133);
        chat2.setMsgPic(null); /* Reset msg icon */
    },

    onMeMind: function (variable, value) {
        var e = document.getElementsByName("meMind")[0];
        e.defaultValue = e.value = value;
    },

    onMeEmblem: function (variable, value) {
        var e = document.getElementsByName("meEmblem")[0];
        e.defaultValue = e.value = value;
        if (value) document.getElementById("meEmblemImg").src = value || 'images/blank.gif';
        chat2.setMsgPic(null); /* Reset msg icon */
    },

    onMeColor: function (variable, value) {
        var e = document.getElementsByName("meColor")[0];
        e.defaultValue = e.value = value;
        chat2.setMsgColor(null);
    },

    setMsgPic: function (url) {
        chat2.msgPic = url;
        url = url || a2ac.me.icon || "images/star.png";
        let img = document.getElementById("msgPicImg");
        img.src = url;
        img.style.filter = 'drop-shadow(0 0 0.5rem ' + a2ac.me.color + ')';
    },

    setMsgColor: function (color) {
        chat2.msgColor = color;
    },

    updateForm: function (variable, value) {
        let c = chat2.context;
        let form = chat2.targetForm && document.getElementById(chat2.targetForm);
        if (!form) return;

        var t = {
            "nickname": "iName",
            "icon": "iPic",
            "emblem": "iEmblem",
            "mind": "iMind",
            "color": "iColor",
            "from": "mFrom",
            "content": "mContent",
            "date": "mDate"
        };
        var id = t[variable];
        if (!id) return;
        form.getElementsByClassName(id)[0].value = value;
        if (id == 'iPic')
            imgBoxURL(form.getElementsByClassName("iPicImg")[0], value, 99, 133);
        if (id == 'iEmblem') {
            let e = form.getElementsByClassName("iEmblemImg")[0]
            e.src = value || '';
            e.style.display = value ? 'block' : 'none';
        }
    },

    showContextForm: function (e) {
        var form = this.contextForm = document.getElementById("contextForm");
        if (form && form.style.display !== 'none') {
            // s'il y a déjà un formulaire, on le masque
            e = null;
        }

        form.style.display = "none";
        form.style.width = "";
        form.style.height = "";
        if (!e || !e.item || !form) return;

        let c = chat2.context;
        if (c) {
            if (c.profileId !== undefined) {
                c.unsubscribe("nickname", this.updateForm);
                c.unsubscribe("icon", this.updateForm);
                c.unsubscribe("mind", this.updateForm);
                c.unsubscribe("emblem", this.updateForm);
                c.unsubscribe("color", this.updateForm);
                c = null;
            } else if (c.content !== undefined) {
                c.unsubscribe("content", this.updateForm);
                c.unsubscribe("date", this.updateForm);
            }
        }

        // form choice
        var isMe = (e.item === a2ac.me);
        var targetForm = (isMe ? "mePropsForm"
            : (e.item.nickname !== undefined ? "iPropsForm"
                : (e.item.content !== undefined ? "mPropsForm" : null)));
        chat2.targetForm = targetForm;
        for (var i = 0, l = ["mePropsForm", "iPropsForm", "mPropsForm"]; i < l.length; i++) {
            var elt = l[i];
            if (elt == targetForm) continue;
            try { document.getElementById(elt).style.display = "none"; } catch (e) { };
        }
        let iForm = targetForm && document.getElementById(targetForm);
        if (iForm) iForm.style.display = "block";

        // form fill up
        if (targetForm == "iPropsForm") {
            e.item.subscribeSync("nickname", this.updateForm);
            e.item.subscribeSync("icon", this.updateForm);
            e.item.subscribeSync("mind", this.updateForm);
            e.item.subscribeSync("emblem", this.updateForm);
            e.item.subscribeSync("color", this.updateForm);
            this.context = c = e.item;
        } else if (targetForm == "mPropsForm") {
            e.item.subscribeSync("from", this.updateForm);
            e.item.subscribeSync("date", this.updateForm);
            e.item.subscribeSync("content", this.updateForm);
        }


        // the incoming animation
        var a = new Anim();
        a.form = form;
        a.ratio = 0;
        var coords = readDOM(e.img);
        if (isNaN(coords.x)) coords = readDOM(e.desc);
        var ed = getEltDimensions(form);
        var wd = getWindowDimensions(window);
        a.start = { x: coords.x, y: coords.y, w: coords.w, h: coords.h };
        a.current = Object.assign({}, a.start);
        a.end = {
            x: (wd[0] - ed[0]) / 2,
            y: (wd[1] - ed[1]) / 2,
            w: ed[0],
            h: ed[1]
        };
        a.iterate = contextFormAnimIterate;
        a.onResume = function () { this.form.style.display = "block"; };
        a.resume();
    },

    submitContextForm: function (e) {
        a2ac.me.set('nickname', document.getElementsByName('meNickname')[0].value);
        a2ac.me.set('emblem', document.getElementsByName('meEmblem')[0].value);
        a2ac.me.set('mind', document.getElementsByName('meMind')[0].value);
        a2ac.me.set('icon', document.getElementsByName('mePic')[0].value);
        a2ac.me.set('color', document.getElementsByName('meColor')[0].value);
        this.showContextForm(null);
    },

    advertiseMessage: function (item) {
        chat2.revolutionOfEvents.push(item);
        setTimeout(chat2.unstackEventCB, 5000);
    },
    unstackEventCB: function () {
        chat2.revolutionOfEvents.splice(0, 1);
    },

    browsePast: function (event) {
        var keyId = event.keyCode;
        if (keyId == 38) { // up 
            if (chat2.historyIndex < chat2.history.length - 1) {
                chat2.historyIndex++;
                this.value = chat2.history[chat2.historyIndex];
            }

        } else if (keyId == 40) { // down
            if (chat2.historyIndex >= 0) {
                chat2.historyIndex--;
                this.value = (chat2.historyIndex == -1
                    ? '' : chat2.history[chat2.historyIndex]);
            }
        } else {
            // chat2.historyIndex = 0;
        }
    },

    init: function () {
        if (typeof console != "object") { var console = { log: function () { } }; };

        var a2acAgora = getURLParameterByName("agora");
 
        // Init gliders
        this.intendeesGlider.init(document.getElementById("intendeesGlider"), "left", "width");
        this.messagesGlider.init(document.getElementById("messagesGlider"), "bottom", "height");

        { // Init revolutions
            var iArea = document.getElementById("intendeesArea");
            var mArea = document.getElementById("msgsArea");
            var eArea = document.getElementById("eventsArea");
            IntendeeCell.prototype.area = iArea;
            IntendeeCell.prototype.trap = this.iTrap;
            MessageCell.prototype.area = mArea;
            MessageCell.prototype.trap = this.mTrap;
            EventCell.prototype.area = eArea;
            EventCell.prototype.trap = null;

            this.revolutionOfIntendees.init(IntendeeCell, this.intendeesGlider);
            this.revolutionOfMessages.init(MessageCell, this.messagesGlider);
            this.revolutionOfEvents.init(EventCell, null);
        }

        if (!a2acAgora)
            a2acAgora = 'a2ac';
        autobus.agora = a2acAgora + '/';

        this.iTrap.bind(document.getElementById("intendeesTrap"));
        this.iTrap.onResume = function () { chat2.revolutionOfIntendees.resume(); }
        this.iTrap.onPause = function () { chat2.revolutionOfIntendees.friction = null; }
        this.iTrap.iterate = function () {
            Trap.prototype.iterate.call(this);
            chat2.revolutionOfIntendees.friction = this.down ? - this.dx / IntendeeCell.prototype.gap : null;
            return this.down;
        }

        this.mTrap.bind(document.getElementById("msgsTrap"));
        this.mTrap.onResume = function () { chat2.revolutionOfMessages.resume(); }
        this.mTrap.onPause = function () { chat2.revolutionOfMessages.friction = null; }
        this.mTrap.iterate = function () {
            Trap.prototype.iterate.call(this);
            chat2.revolutionOfMessages.friction = this.down ? this.dy / MessageCell.prototype.gap : null;
            return this.down;
        }

        document.getElementById("intendeesBack").onmousedown = function () { chat2.revolutionOfIntendees.friction = -0.2; chat2.revolutionOfIntendees.resume(); };
        document.getElementById("intendeesBack").onmouseup = document.getElementById("intendeesBack").onmouseout = function () { chat2.revolutionOfIntendees.friction = null; };
        document.getElementById("intendeesForward").onmousedown = function () { chat2.revolutionOfIntendees.friction = 0.2; chat2.revolutionOfIntendees.resume(); };
        document.getElementById("intendeesForward").onmouseup = document.getElementById("intendeesForward").onmouseout = function () { chat2.revolutionOfIntendees.friction = null; };
        document.body.onmouseover = function () {
            a2ac.me.awayAttractor.set('away', false);
        };
        window.onfocus = function () {
            a2ac.me.activitySummary.set('watching', true);
            a2ac.me.awayAttractor.set('away', false);
        };
        window.onblur = function () {
            a2ac.me.activitySummary.set('watching', false);
            a2ac.me.awayAttractor.set('away', true);
        };
        var input = document.getElementById("messageBody");
        input.onkeydown = function () {
            a2ac.me.awayAttractor.set('away', false);
            a2ac.me.typingAttractor.set('typing', true);
        };
        input.onkeyup = function (e) {
            chat2.browsePast.call(this, e);
        };
        var defaultValue = input.value;
        input.value = '';

        input.onfocus = function () {
            a2ac.me.awayAttractor.set('away', false);
            if (this.value == defaultValue) {
                this.value = '';
                this.style.color = a2ac.me.color;
                var lighter = RGBColor.lighter(a2ac.me.color).toName();
                this.style.textShadow = "1px 2px 3px " + lighter;
            }
        };
        input.onblur = function () {
            a2ac.me.awayAttractor.set('away', false);
            if (!this.value.length) {
                this.value = defaultValue;
                this.style.color = "gray";
                this.style.textShadow = undefined;
            }
        };

        a2ac.init();
        input.onfocus();
        a2ac.neighbourhood.subscribeSync("intendees", chat2.onIntendeesSplice);
        a2ac.neighbourhood.subscribeSync("messages", chat2.onMessagesSplice);
        a2ac.me.subscribeSync("nickname", this.onMeNickname);
        a2ac.me.subscribeSync("icon", this.onMeIcon);
        a2ac.me.subscribeSync("mind", this.onMeMind);
        a2ac.me.subscribeSync("emblem", this.onMeEmblem);
        a2ac.me.subscribeSync("color", this.onMeColor);
    },

    finalize: function () {
        a2ac.finalize();
    },

    reset: function () {
        a2ac.reset();
    }
};
