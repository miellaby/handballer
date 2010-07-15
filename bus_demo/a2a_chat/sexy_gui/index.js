// ======================================================================
// Javascript glue for index.html
// ======================================================================


IntendeeCell.prototype.onClick = function() {
    chat2.showContextForm(this);
}

MessageCell.prototype.onClick = function() {
//    chat2.showContextForm(this);
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
    chat2.revolutionOfMessages && chat2.revolutionOfMessages.unshift({"from": "code", "content": msg, "icon": pic, "color": color || "purple"});
}

// ****************************************
// The main application logic : chat2
// ****************************************
var chat2 = {
    context: null,
    contextForm: null,
    revolutionOfIntendees: new Revolution(),
    revolutionOfMessages:  new Revolution(),
    revolutionOfEvents:  new Revolution(),
    intendeesGlider: new Glider(),
    messagesGlider: new Glider(),
    iTrap: new Trap(),
    mTrap: new Trap(),
    msgPic: null,
    msgColor: null,
    creole: new Parse.Simple.Creole({forIE: document.all,
                                     interwiki: {
                WikiCreole: 'http://www.wikicreole.org/wiki/',
                Wikipedia: 'http://en.wikipedia.org/wiki/'},
                                     linkFormat: '' }),
    incomingSound: null,
    leavingSound: null,
    speakingSound: null,
    history: [],
    historyIndex: -1,
    onIntendeesSplice: function(tag, index, howMany /*, intendee, intendee ... */) {
        //console.log(arguments);
        var args = Array.prototype.slice.call(arguments,1);
        if (chat2.incomingSound && args.length > 2)
            chat2.incomingSound.play();
        if (chat2.leavingSound && howMany)
            chat2.leavingSound.play();
        chat2.revolutionOfIntendees.splice.apply(chat2.revolutionOfIntendees, args);
    },

    onMessagesSplice: function(tag, index, howMany /*, message, message ... */) {
        
        var hidden = (document.getElementById("msgsArea").style.display == "none");

        if (chat2.speakingSound && arguments.length > 2 && !a2ac.me.watching && !a2ac.me.typing) // need to make sound if no activity
            chat2.speakingSound.play();

        for (var i = index, n = index + howMany ; i < index; i++) {
            chat2.revolutionOfMessages.remove(chat2.revolutionOfMessages.items.indexOf(this.intendees[i]));
        }

        for (var l = arguments, i = 3 /* jump over the first args */, n = l.length; i < n; ++i) {
            var newItem = l[i];
            chat2.revolutionOfMessages.unshift(newItem);
            if (hidden || chat2.revolutionOfMessages.n > 0)
                chat2.advertiseMessage(newItem);
        }
    },

    onMessageSubmit: function() {
        var v = document.getElementById('messageBody');
        var lastWord = v.value.substr(v.value.lastIndexOf(' ') + 1);
        var p = lastWord ? settings.current[encodeURIComponent(lastWord).replace(/\./g, '%2E')] : null;
        if (p && lastWord == v.value) {
            a2ac.me.setProfileId(encodeURIComponent(lastWord).replace(/\./g, '%2E'));
           // a2ac.me.postMessage("", a2ac.me.icon, a2ac.me.color);
        } else if (p) {
            v.value = v.value.substr(0, v.value.lastIndexOf(' '));
            a2ac.me.postMessage(p.emblem ? v.value + " {{" + p.emblem + "}}" : v.value, p.icon, p.color);
        } else {
            a2ac.me.postMessage(v.value, a2ac.me.icon, a2ac.me.color);
        }
      
        if (v.value) {
            chat2.history.unshift(v.value);
            if (chat2.history.length > 100)
                chat2.history.splice(100,1);
        }
        chat2.historyIndex = -1;
        v.value = "";
    },

    onMeProfileId: function(variable, value) {
        value = decodeURIComponent(value);
        var s = document.getElementById("meProfileId");
        var ot = s.options;
        s.value = value;
        if (s.selectedIndex <= 0) {
            var o = document.createElement("option");
            o.value = value;
            o.text = value;
            ot.add(o);
            s.value = value;
        }
        s.defaultValue = value;
//         for (var i = 0; i < ot.length && ot[i].text != value; i++);
//         if (i < ot.length)
//             s.selectedIndex = i;
//         else {
//             s.add(new Option(value, value));
//             s.selectedIndex = ot.length;
//         }
    },


    onMeNickname: function(variable, value) {
        var e = document.getElementById("meNickname");
        e.defaultValue = e.value = value;
    },

    onMeIcon: function(variable, value) {
        var e = document.getElementById("mePic");
        e.defaultValue = e.value = value;
        imgBoxURL(document.getElementById("mePicImg"), value, 99, 133);
        chat2.setMsgPic(null); /* Reset msg icon */
    },

    onMeMind: function(variable, value) {
        var e = document.getElementById("meMind");
        e.defaultValue = e.value = value;
    },

    onMeEmblem: function(variable, value) {
        var e = document.getElementById("meEmblem");
        e.defaultValue = e.value = value;
        document.getElementById("meEmblemImg").src = value || 'images/blank.gif';
        chat2.setMsgPic(null); /* Reset msg icon */
    },

    onMeColor: function(variable, value) {
        var e = document.getElementById("meColor");
        e.defaultValue = e.value = value;
        chat2.setMsgColor(null);
    },

    setMsgPic: function(url) {
        this.msgPic = url;
        if (!url) url = a2ac.me.icon || "images/star.png"; 
        document.getElementById("msgPicImg").src = url;
    },

    setMsgColor: function(color) {
        this.msgColor = color;
    },

    resetProfileList: function() {
        var p = a2ac.me.profileId, s = document.getElementById("meProfileId");
        s.options.length = 1;
        for (var k in settings.current) {
            if (!k || !settings.current.hasOwnProperty(k)) continue;
            var o = document.createElement("option");
            var dk = decodeURIComponent(k);
            o.value = dk;
            o.text = dk;
            s.options.add(o);
            if (k == p) s.selectedIndex = s.options.length - 1;
        }
    },

    deleteCurrentProfile: function() {
        var d = null, p = a2ac.me.profileId;
        for (var k in settings.current) {
            if (!k || !settings.current.hasOwnProperty(k) || k == p) continue;
            a2ac.me.setProfileId(k);
            d = p;
            break;
        }
        if (d) {
            delete settings.current[d];
            this.resetProfileList();
        }
    },

    updateForm: function(variable, value) {
        var t = { "nickname": "iName", "icon": "iPic", "emblem": "iEmblem", "mind": "iMind", "color": "iColor", "from": "mFrom", "date": "mDate" } ;
        var id = t[variable];
        if (!id) return;
        document.getElementById(id).value = value;
        if (id == 'iPic')
            imgBoxURL(document.getElementById("iPicImg"), value, 99, 133);
        if (id == 'iEmblem')
            document.getElementById("iEmblemImg").src = value;
    },
    
    showContextForm: function(e) {
        var form = this.contextForm = document.getElementById("contextForm");
        form.style.display = "none";
        form.style.width = "";
        form.style.height = "";
        if (!e || !form) return;

        if (this.context) {
            if (this.context.profileId !== undefined) {
                this.context.unsubscribe("nickname", this.updateForm);
                this.context.unsubscribe("icon", this.updateForm);
                this.context.unsubscribe("mind", this.updateForm);
                this.context.unsubscribe("emblem", this.updateForm);
                this.context.unsubscribe("color", this.updateForm);
                this.context = null;
            } else if (this.context.content !== undefined) {
                this.context.unsubscribe("content", this.updateForm);
                this.context.unsubscribe("date", this.updateForm);
            }
        }

        // form choice
        var isMe = (e.item === a2ac.me);
        var targetForm = (isMe ? "mePropsForm"
                          : (e.item.profileId !== undefined ? "iPropsForm"
                             : (e.item.content !== undefined ? "mPropsForm" : null )));
        for (var i = 0, l = ["mePropsForm", "iPropsForm", "mPropsForm"]; i < l.length; i++) {
            var elt = l[i];
            if (elt == targetForm) continue;
            try { document.getElementById(elt).style.display = "none"; } catch (e) {};
        }
        if (targetForm) document.getElementById(targetForm).style.display = "block";

        // form fill up
        if (targetForm == "iPropsForm") {
            e.item.subscribeSync("nickname", this.updateForm);
            e.item.subscribeSync("icon", this.updateForm);
            e.item.subscribeSync("mind", this.updateForm);
            e.item.subscribeSync("emblem", this.updateForm);
            e.item.subscribeSync("color", this.updateForm);
            this.context = e.item;
        } else if (targetForm == "mPropsForm") {
            e.item.subscribeSync("from", this.updateForm);
            e.item.subscribeSync("date", this.updateForm);
        }


        // the incoming animation
        var a = new Anim();
        a.form = form;
        a.ratio = 0;
        var coords = readDOM(e.img);
        if (isNaN(coords.x)) coords = readDOM(e.desc);
        var ed = getEltDimensions(form);
        var wd = getWindowDimensions(window);
        a.start = {x: coords.x, y: coords.y, w: coords.w, h: coords.h};
        a.current = Object.copy(a.start);
        a.end = {
            x: (wd[0]-ed[0]) / 2,
            y: (wd[1]-ed[1]) / 2,
            w: ed[0],
            h: ed[1]
        };
        a.iterate = contextFormAnimIterate;
        a.onResume = function() { this.form.style.display = "block"; };
        a.resume();
    },

    submitContextForm: function(e) {
        var s = document.getElementById('meProfileId'), profileId;
        if (s.style.display != 'none') {
            profileId = s.options[s.selectedIndex].text;
        } else {
            profileId = document.getElementById('meNewProfileId').value;
        }
        profileId = encodeURIComponent(profileId).replace(/\./g, '%2E');
        if (a2ac.me.get("profileId") != profileId) {
            a2ac.me.setProfileId(profileId);
            return;
        }
        a2ac.me.set('nickname', document.getElementById('meNickname').value);
        a2ac.me.set('emblem', document.getElementById('meEmblem').value);
        a2ac.me.set('mind', document.getElementById('meMind').value);
        a2ac.me.set('icon', document.getElementById('mePic').value);
        a2ac.me.set('color', document.getElementById('meColor').value);
        this.showContextForm(null);
    },

    advertiseMessage: function(item) {
        chat2.revolutionOfEvents.push(item);
        setTimeout(chat2.unstackEventCB, 5000);
    },
    unstackEventCB: function() {
        chat2.revolutionOfEvents.splice(0, 1);
    },

    browsePast: function(event) {
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

    init: function() {
        if (typeof console != "object") { var console = { log: function() {} }; };

        var a2acAgora = getURLParameterByName("agora"),
            back = getURLParameterByName("back");


        var back = getURLParameterByName("back");
        if (!back) {
            document.getElementById("closeButton").style.display = "none";
            document.getElementById("hideButton").style.display = "none";
        } else {
            var el = document.createElement("iframe");
            el.setAttribute('id', 'bfrm');
            el.setAttribute('style', 'position: absolute; border: 0; margin: 0; padding: 0; width: 100%; height: 100%; z-index:0;');
            document.body.appendChild(el);
            el.setAttribute('src', back);
            document.getElementById("closeButton").onclick = function() {window.location = back;};
            document.getElementById("hideButton").onclick = function() {chat2.hide();};
        }

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
            a2acAgora = (back ? back.b64() : 'a2ac') ;
        autobus.agora = a2acAgora + '/';

        autobus.tagsonomy.subscribe("intendee", chat2.onIntendeesSplice);
        autobus.tagsonomy.subscribe("message", chat2.onMessagesSplice);

        this.iTrap.bind(document.getElementById("intendeesTrap"));
        this.iTrap.onResume = function() { chat2.revolutionOfIntendees.resume(); }
        this.iTrap.onPause = function() { chat2.revolutionOfIntendees.friction=null; }
        this.iTrap.iterate = function() {
            Trap.prototype.iterate.call(this);
            chat2.revolutionOfIntendees.friction = this.down ? - this.dx / IntendeeCell.prototype.gap : null;
            return this.down;
        }

        this.mTrap.bind(document.getElementById("msgsTrap"));
        this.mTrap.onResume = function() { chat2.revolutionOfMessages.resume(); }
        this.mTrap.onPause = function() { chat2.revolutionOfMessages.friction=null; }
        this.mTrap.iterate = function() {
            Trap.prototype.iterate.call(this);
            chat2.revolutionOfMessages.friction = this.down ? this.dy / MessageCell.prototype.gap : null;
            return this.down;
        }

        document.getElementById("intendeesBack").onmousedown = function() { chat2.revolutionOfIntendees.friction = -0.2; chat2.revolutionOfIntendees.resume(); };
        document.getElementById("intendeesBack").onmouseup = document.getElementById("intendeesBack").onmouseout = function() { chat2.revolutionOfIntendees.friction = null; };
        document.getElementById("intendeesForward").onmousedown = function() { chat2.revolutionOfIntendees.friction = 0.2; chat2.revolutionOfIntendees.resume(); };
        document.getElementById("intendeesForward").onmouseup = document.getElementById("intendeesForward").onmouseout = function() { chat2.revolutionOfIntendees.friction = null; };
        document.getElementById("meNewProfileId").onblur = function() {
             if (this.value) a2ac.me.setProfileId(encodeURIComponent(this.value).replace(/\./g,'%2E'));
             this.style.display = 'none';
             var s = document.getElementById("meProfileId");
             s.style.display = "inline";
        }
        document.getElementById("meProfileId").onchange = function() {
            if (this.selectedIndex <= 0) {
                this.style.display = 'none';
                var i = document.getElementById("meNewProfileId");
                i.style.display = "inline";
                i.value = "my new profile";
                i.focus();
                i.select();
                
                
            } else {
                var profileId = this.options[this.selectedIndex].value;
                profileId = encodeURIComponent(profileId).replace(/\./g,'%2E');
                a2ac.me.setProfileId(profileId);
            }
        }
 
        document.body.onmouseover = function() { a2ac.me.watchingActivity.set(true); };
        document.body.onmouseout = function() { a2ac.me.watchingActivity.set(false); };
        window.onfocus = function() { a2ac.me.typingActivity.set(true); a2ac.me.typingActivity.set(false); };
        window.onblur = function() { a2ac.me.typingActivity.set(false); };

        var input = document.getElementById("messageBody");
        input.onkeydown = function() {
            a2ac.me.typingActivity.set(true);
        };
        input.onkeyup = function(e) {
            a2ac.me.typingActivity.set(false);
            chat2.browsePast.call(this, e);
        }
        var defaultValue = input.value;
        input.value = '';

        input.onfocus = function() {
            if (this.value == defaultValue) {
                this.value='';
                this.style.color = a2ac.me.color;
                var darker = RGBColor.darker(a2ac.me.color).toName();

                this.style.textShadow = "0 1px 0.5px " + darker + ", 0 -1px 0.5px " + darker;
            }
        };
        input.onblur = function() {
            if (!this.value.length) {
                this.value = defaultValue;
                this.style.color = "gray";
                this.style.textShadow = "0 1px 10px #000, 0 -1px 0.05px #000";
            }
        };
        input.onfocus();

        a2ac.init();
        this.resetProfileList();
        a2ac.me.subscribeSync("profileId", this.onMeProfileId);
        a2ac.me.subscribeSync("nickname", this.onMeNickname);
        a2ac.me.subscribeSync("icon", this.onMeIcon);
        a2ac.me.subscribeSync("mind", this.onMeMind);
        a2ac.me.subscribeSync("emblem", this.onMeEmblem);
        a2ac.me.subscribeSync("color", this.onMeColor);
    },

    finalize: function() {
        a2ac.finalize();
    },
    
    reset: function() {
        a2ac.reset();
        this.resetProfileList();
    },

    hide: function(value) {
        var c = document.getElementById("hideButton");
        var a = new Anim();
        a.ia = document.getElementById("intendeesArea");
        a.ma = document.getElementById("msgsArea");
        a.pf = document.getElementById("postForm");
        a.pl = document.getElementById("postLayer");
        a.ratio = 0;
        var edi = getEltDimensions(a.ia);
        var edp = getEltDimensions(a.pf);
        if (value === undefined)
            value = (a.ma.style.display != "none");
        c.src = value ? "images/micross.png" : "images/crossmi.png";
        a.start = {y: value ? 0 : -edi[1]};
        a.current = Object.copy(a.start);
        a.start2 = {y: value ? 0 : -edp[1]};
        a.current2 = Object.copy(a.start2);
        a.end = { y: value ? -edi[1] : 0 };
        a.end2 = { y: value ? -edp[1] : 0 };
        if (!value) {
            
            a.ia.style.display =
                a.pf.style.display =
                a.pl.style.display = "block";
            chat2.revolutionOfIntendees.redraw(); // redraw to get cells removed by hiding
        }
        a.iterate = function() {
            this.current.y = this.start.y + (this.end.y - this.start.y) * this.ratio;
            this.current2.y = this.start2.y + (this.end2.y - this.start2.y) * this.ratio;
            writeDOM(this.ia, this.current);
            writeDOM(this.pf, this.current2, "left", "bottom");
            writeDOM(this.pl, this.current2, "left", "bottom");
            this.ratio += 0.1;
            if (this.ratio > 1) {
                if (this.end.y < 0) {
                    this.ia.style.display =
                        this.pf.style.display =
                        this.pl.style.display =
                        this.ma.style.display = "none";
                } else {
                    this.ma.style.display = "block";
                    chat2.revolutionOfMessages.redraw(); // redraw to get cells removed by hiding
                }
            }
            return this.ratio <= 1;
        }
        a.resume();

    }
};
soundManager.url = "./sound";
soundManager.onload = function() {
  chat2.incomingSound = soundManager.createSound({
    id: 'incoming',
    url: 'sound/freesound__soaper__footsteps_1.mp3'
  });

  chat2.leavingSound = soundManager.createSound({
    id: 'leaving',
    url: 'sound/freesound__FreqMan__011_Door_opens_and_shuts.mp3'
  });

  chat2.speakingSound  = soundManager.createSound({
    id: 'speaking',
    url: 'sound/freesound__acclivity__Goblet_G_Medium.mp3'
  });
};


soundManager.onerror = function() {
  // SM2 could not start, no sound support, something broke etc. Handle gracefully.
};
