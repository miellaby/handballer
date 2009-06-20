// ======================================================================
// Javascript glue for chat2.html
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
    return this.ratio <= 1;
}

function puts(msg, pic) {
    chat2.revolutionOfMessages && chat2.revolutionOfMessages.unshift({"from": "code", "content": msg, "icon": pic});
}


var chat2 = {
    context: null,
    contextForm: null,
    revolutionOfIntendees: new Revolution(),
    revolutionOfMessages:  new Revolution(),
    iTrap: new Trap(),
    mTrap: new Trap(),
    msgPic: null,
    onIntendeesSplice: function(tag, index, howMany /*, intendee, intendee ... */) {
        //console.log(arguments);
        var args = Array.prototype.slice.call(arguments,1);
        if (args.length > 2)
            sound.play("incoming", 5000);
        if (howMany)
            sound.play("leaving", 5000);
        chat2.revolutionOfIntendees.splice.apply(chat2.revolutionOfIntendees, args);
    },

    onMessagesSplice: function(tag, index, howMany /*, message, message ... */) {
        
        if (arguments.length > 2 && !a2ac.me.watching && !a2ac.me.typing) // need to make sound if no activity
            sound.play("blah!", 5000);

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
        a2ac.me.postMessage(v.value, chat2.msgPic);
        v.value = "";
    },

    onMeNickname: function(variable, value) {
        document.getElementById("meName").value = value;
    },

    onMeIcon: function(variable, value) {
        document.getElementById("mePic").value = value;
        document.getElementById("mePicImg").src = value;
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

    setMsgPic: function(url) {
        chat2.msgPic = url;
        if (!url) url = a2ac.me.icon || "sexy_gui/images/star.gif"; 
        document.getElementById("msgPicImg").src = url;
    },

    updateForm: function(variable, value) {
        var t = { "nickname": "iName", "icon": "iPic", "emblem": "iEmblem", "mind": "iMind", "from": "mFrom", "date": "mDate" } ;
        var id = t[variable];
        if (!id) return;
        document.getElementById(id).value = value;
        if (id == 'iPic')
            document.getElementById("iPicImg").src = value;
        if (id == 'iEmblem')
            document.getElementById("iEmblemImg").src = value;
    },
    
    showContextForm: function(e) {
        var form = chat2.contextForm = document.getElementById("contextForm");
        chat2.contextForm.style.display = "none";
        if (!e || !form) return;

        if (chat2.context) {
            if (chat2.context.nickname !== undefined) {
                chat2.context.unsubscribe("nickname", chat2.updateForm);
                chat2.context.unsubscribe("icon", chat2.updateForm);
                chat2.context.unsubscribe("mind", chat2.updateForm);
                chat2.context.unsubscribe("emblem", chat2.updateForm);
                chat2.context = null;
            } else if (char2.context.content !== undefined) {
                chat2.context.unsubscribe("content", chat2.updateForm);
                chat2.context.unsubscribe("date", chat2.updateForm);
            }
        }

        // form choice
        var isMe = (e.item === a2ac.me);
        var targetForm = (isMe ? "mePropsForm"
                          : (e.item.nickname !== undefined ? "iPropsForm"
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
            e.item.subscribeSync("nickname", chat2.updateForm);
            e.item.subscribeSync("icon", chat2.updateForm);
            e.item.subscribeSync("mind", chat2.updateForm);
            e.item.subscribeSync("emblem", chat2.updateForm);
            chat2.context = e.item;
        } else if (targetForm == "mPropsForm") {
            e.item.subscribeSync("from", chat2.updateForm);
            e.item.subscribeSync("date", chat2.updateForm);
        }


        // the incoming animation
        var a = new Anim();
        a.form = form;
        a.ratio = 0;
        a.start = a.current = {x: -100, y: 400};
        var coords = readDOM(e.img);
        if (isNaN(coords.x)) coords = readDOM(e.desc);
        a.end = {
            x: coords.x + coords.w * 0.33,
            y: coords.y + coords.h * 0.66
        };
        log(a.end);
        a.iterate = contextFormAnimIterate;
        a.onResume = function() { this.form.style.display = "block"; };
        a.resume();
    },

    submitContextForm: function(e) {
        var nickname = document.getElementById('meName').value;
        if (a2ac.me.get("nickname") != nickname)
            a2ac.me.setNickname(nickname);
        a2ac.me.set('emblem', document.getElementById('meEmblem').value);
        a2ac.me.set('mind', document.getElementById('meMind').value);
        a2ac.me.set('icon', document.getElementById('mePic').value);
        chat2.showContextForm(null);
    },

    init: function() {

        this.revolutionOfIntendees.init(document.getElementById("intendeesArea"), IntendeeCell, 50);
        this.revolutionOfMessages.init(document.getElementById("msgsArea"), MessageCell, 50);

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
        document.getElementById("intendeesBack").onmouseup = function() { chat2.revolutionOfIntendees.friction = null; };
        document.getElementById("intendeesForward").onmousedown = function() { chat2.revolutionOfIntendees.friction = 0.2; chat2.revolutionOfIntendees.resume(); };
        document.getElementById("intendeesForward").onmouseup = function() { chat2.revolutionOfIntendees.friction = null; };
 
        document.getElementById("meName").onblur = function() { a2ac.me.setNickname(document.getElementById('meName').value); }

        sound.preload("sexy_gui/sound/freesound__soaper__footsteps_1.mp3", "incoming");
        sound.preload("sexy_gui/sound/freesound__FreqMan__011_Door_opens_and_shuts.mp3", "leaving");
        sound.preload("sexy_gui/sound/freesound__acclivity__Goblet_G_Medium.mp3", "blah!");

        document.body.onmouseover = function() { a2ac.me.watchingActivity.set(true); };
        document.body.onmouseout = function() { a2ac.me.watchingActivity.set(false); };
        window.onfocus = function() { a2ac.me.typingActivity.set(true); a2ac.me.typingActivity.set(false); };
        window.onblur = function() { a2ac.me.typingActivity.set(false); };
        var input = document.getElementById("messageBody");
        input.onkeydown = function() { a2ac.me.typingActivity.set(true); };
        input.onkeyup = function() { a2ac.me.typingActivity.set(false); };
        var defaultValue = input.value;
        input.style.color = "gray";
        input.onfocus = function() { if (this.value == defaultValue) { this.value=''; this.style.color = "black"; } };
        input.onblur = function() { if (!this.value.length) { this.value = defaultValue; this.style.color = "gray"; } };
        a2ac.init();

        a2ac.me.subscribeSync("nickname", chat2.onMeNickname);
        a2ac.me.subscribeSync("icon", chat2.onMeIcon);
        a2ac.me.subscribeSync("mind", chat2.onMeMind);
        a2ac.me.subscribeSync("emblem", chat2.onMeEmblem);
    },

    finalize: function() {
        a2ac.finalize();
    }
};