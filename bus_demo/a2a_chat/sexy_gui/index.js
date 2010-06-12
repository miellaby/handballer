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


var chat2 = {
    context: null,
    contextForm: null,
    revolutionOfIntendees: new Revolution(),
    revolutionOfMessages:  new Revolution(),
    intendeesGlider: new Glider(),
    messagesGlider: new Glider(),
    iTrap: new Trap(),
    mTrap: new Trap(),
    msgPic: null,
    msgColor: null,
    incomingSound: null,
    leavingSound: null,
    speakingSound: null,
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
        
        if (chat2.speakingSound && arguments.length > 2 && !a2ac.me.watching && !a2ac.me.typing) // need to make sound if no activity
            chat2.speakingSound.play();

        for (var i = index, n = index + howMany ; i < index; i++) {
            chat2.revolutionOfMessages.remove(chat2.revolutionOfMessages.items.indexOf(this.intendees[i]));
        }

        for (var l = arguments, i = 3 /* jump over the first args */, n = l.length; i < n; ++i) {
            var newItem = l[i];
            chat2.revolutionOfMessages.unshift(newItem);
        }
    },

    onMessageSubmit: function() {
        var v = document.getElementById('messageBody');
        a2ac.me.postMessage(v.value, chat2.msgPic, chat2.msgColor);
        v.value = "";
    },

    onMeProfileId: function(variable, value) {
        document.getElementById("meProfileId").value = value;
    },


    onMeNickname: function(variable, value) {
        document.getElementById("meNickname").value = value;
    },

    onMeIcon: function(variable, value) {
        document.getElementById("mePic").value = value;
        imgBoxURL(document.getElementById("mePicImg"), value, 100, 150);
        chat2.setMsgPic(null);
    },

    onMeMind: function(variable, value) {
        document.getElementById("meMind").value = value;
    },

    onMeEmblem: function(variable, value) {
        document.getElementById("meEmblem").value = value;
        document.getElementById("meEmblemImg").src = value;
        chat2.setMsgPic(null);
    },

    onMeColor: function(variable, value) {
        document.getElementById("meColor").value = value;
        chat2.setMsgColor(null);
    },

    setMsgPic: function(url) {
        chat2.msgPic = url;
        if (!url) url = a2ac.me.icon || "images/star.gif"; 
        document.getElementById("msgPicImg").src = url;
    },

    setMsgColor: function(color) {
        chat2.msgColor = color;
        if (!color) color = a2ac.me.color; 
    },

    updateForm: function(variable, value) {
        var t = { "nickname": "iName", "icon": "iPic", "emblem": "iEmblem", "mind": "iMind", "color": "iColor", "from": "mFrom", "date": "mDate" } ;
        var id = t[variable];
        if (!id) return;
        document.getElementById(id).value = value;
        if (id == 'iPic')
            imgBoxURL(document.getElementById("iPicImg"), value, 100, 150);
        if (id == 'iEmblem')
            document.getElementById("iEmblemImg").src = value;
    },
    
    showContextForm: function(e) {
        var form = chat2.contextForm = document.getElementById("contextForm");
        form.style.display = "none";
        form.style.width = "";
        form.style.height = "";
        if (!e || !form) return;

        if (chat2.context) {
            if (chat2.context.profileId !== undefined) {
                chat2.context.unsubscribe("nickname", chat2.updateForm);
                chat2.context.unsubscribe("icon", chat2.updateForm);
                chat2.context.unsubscribe("mind", chat2.updateForm);
                chat2.context.unsubscribe("emblem", chat2.updateForm);
                chat2.context.unsubscribe("color", chat2.updateForm);
                chat2.context = null;
            } else if (char2.context.content !== undefined) {
                chat2.context.unsubscribe("content", chat2.updateForm);
                chat2.context.unsubscribe("date", chat2.updateForm);
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
            e.item.subscribeSync("nickname", chat2.updateForm);
            e.item.subscribeSync("icon", chat2.updateForm);
            e.item.subscribeSync("mind", chat2.updateForm);
            e.item.subscribeSync("emblem", chat2.updateForm);
            e.item.subscribeSync("color", chat2.updateForm);
            chat2.context = e.item;
        } else if (targetForm == "mPropsForm") {
            e.item.subscribeSync("from", chat2.updateForm);
            e.item.subscribeSync("date", chat2.updateForm);
        }


        // the incoming animation
        var a = new Anim();
        a.form = form;
        a.ratio = 0;
        var coords = readDOM(e.img);
        if (isNaN(coords.x)) coords = readDOM(e.desc);
        var ed = getEltDimensions(form);
        var wd = getWindowDimensions(window);
        a.start = a.current = {x: coords.x, y: coords.y, w: coords.w, h: coords.h};        
        a.end = {
            x: (wd[0]-ed[0]) / 2,
            y: (wd[1]-ed[1]) / 2,
            w: ed[0],
            h: ed[1]
        };
        log(a.end);
        a.iterate = contextFormAnimIterate;
        a.onResume = function() { this.form.style.display = "block"; };
        a.resume();
    },

    submitContextForm: function(e) {
        var profileId = document.getElementById('meProfileId').value;
        if (a2ac.me.get("profileId") != profileId) {
            a2ac.me.setProfileId(profileId);
            return;
        }
        a2ac.me.set('nickname', document.getElementById('meNickname').value);
        a2ac.me.set('emblem', document.getElementById('meEmblem').value);
        a2ac.me.set('mind', document.getElementById('meMind').value);
        a2ac.me.set('icon', document.getElementById('mePic').value);
        a2ac.me.set('color', document.getElementById('meColor').value);
        chat2.showContextForm(null);
    },

    init: function() {

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
        this.intendeesGlider.init(document.getElementById("intendeesGlider"), "left", "width");
        this.messagesGlider.init(document.getElementById("messagesGlider"), "bottom", "height");
        this.revolutionOfIntendees.init(document.getElementById("intendeesArea"), IntendeeCell, this.intendeesGlider);
        this.revolutionOfMessages.init(document.getElementById("msgsArea"), MessageCell, this.messagesGlider);

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
 
        document.getElementById("meProfileId").onblur = function() { a2ac.me.setProfileId(this.value); }
 
        document.body.onmouseover = function() { a2ac.me.watchingActivity.set(true); };
        document.body.onmouseout = function() { a2ac.me.watchingActivity.set(false); };
        window.onfocus = function() { a2ac.me.typingActivity.set(true); a2ac.me.typingActivity.set(false); };
        window.onblur = function() { a2ac.me.typingActivity.set(false); };
        var input = document.getElementById("messageBody");
        input.onkeydown = function() { a2ac.me.typingActivity.set(true); };
        input.onkeyup = function() { a2ac.me.typingActivity.set(false); };
        var defaultValue = input.value;
        input.style.color = "gray";
        input.onfocus = function() { if (this.value == defaultValue) { this.value=''; this.style.color = a2ac.me.color; this.style.textShadow = "0 1px 0.05em #000, 0 -1px 0.05em #000"} };
        input.onblur = function() { if (!this.value.length) { this.value = defaultValue; this.style.color = "gray"; this.style.textShadow = ""; } };
        a2ac.init();

        a2ac.me.subscribeSync("profileId", chat2.onMeProfileId);
        a2ac.me.subscribeSync("nickname", chat2.onMeNickname);
        a2ac.me.subscribeSync("icon", chat2.onMeIcon);
        a2ac.me.subscribeSync("mind", chat2.onMeMind);
        a2ac.me.subscribeSync("emblem", chat2.onMeEmblem);
        a2ac.me.subscribeSync("color", chat2.onMeColor);
    },

    finalize: function() {
        a2ac.finalize();
    },

    hide: function(value) {
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
        a.start = a.current = {y: value ? 0 : -edi[1]};        
        a.start2 = a.current2 = {y: value ? 0 : -edp[1]};        
        a.end = { y: value ? -edi[1] : 0 };
        a.end2 = { y: value ? -edp[1] : 0 };
        if (!value) {
               a.ia.style.display =
                    a.pf.style.display =
                    a.pl.style.display = "block";
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
