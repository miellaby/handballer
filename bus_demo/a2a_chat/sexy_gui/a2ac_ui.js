var contextForm  = {};
function showContextForm(e) {
    if (contextForm.element)
        contextForm.element.style.display = "none";
    contextForm.target = e;
    if (!e) return;
    var isMe = (e.item === me);
    var c = contextForm.element = isMe? document.getElementById("contextForm") : null;
    if (!c) return;
    c.style.display = "block";

    var coords = readDOM(e.img);
    var coords2 = {
        x: coords.x + coords.w * 0.33,
        y: coords.y + coords.h * 0.66
    };
    writeDOM(c, coords2); 
}

function submitContextForm(e) {
    var nickname = document.getElementById('meName').value;
    if (me.get("nickname") != nickname)
        setNickname(nickname);
    me.set('emblem', document.getElementById('meEmblem').value);
    me.set('mind', document.getElementById('meMind').value);
    me.set('icon', document.getElementById('mePic').value);
    showContextForm(null);
}

function IntendeeCell(area) {
    if (!area) return;
    ImgDescCell.call(this, area);
    this.item = null;
    this.img.className += 'intendeePic';
    this.desc.className += 'intendeeDesc';

    this.emblem = document.createElement('img');
    this.emblem.style.display = 'none';
    this.emblem.className += 'intendeeEmblem';
    area.appendChild(this.emblem);

    var self =this;
    this.selfUpdate = function() { self.show(self.item); };
    this.img.onmouseover = function () { self.onClick(); } ;
    this.desc.onmouseover = function () { self.onClick(); } ;
}

IntendeeCell.prototype = new ImgDescCell();
IntendeeCell.prototype.constructor = IntendeeCell;

IntendeeCell.prototype.gap = 130;

IntendeeCell.prototype.height = 130;

IntendeeCell.prototype.defaultImg = "./sexy_gui/images/guest.gif";

IntendeeCell.prototype.defaultDesc = "???";

IntendeeCell.prototype.defaultEmblem = "./sexy_gui/images/blank.gif";

IntendeeCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap, height = this.height;
    this.img.style.top = ((inFactor - 1.0) * height) + "px";
    this.img.style.left = ((x-1) * gap) + "px";
    this.emblem.style.top = ((inFactor - 1.0) * height) + "px";
    this.emblem.style.left = ((x-1) * gap) + "px";
    this.desc.style.top = (inFactor * height) + "px";
    this.desc.style.left = ((x-1) * gap) + "px";
};

IntendeeCell.prototype.onClick = function() {
    showContextForm(this);
}

IntendeeCell.prototype.getOpeningSize = function(area) {
    return area.clientWidth / IntendeeCell.prototype.gap;
}

IntendeeCell.prototype.hide = function() {
    if (!this.item) return;
    if (this.item.unsubscribe) {
        this.item.unsubscribe("icon", this.selfUpdate);
        this.item.unsubscribe("nickname", this.selfUpdate);
        this.item.unsubscribe("emblem", this.selfUpdate);
        this.item.unsubscribe("mind", this.selfUpdate);
    }
    this.emblem.style.display = "none";
    this.img.style.display = "none";
    this.desc.style.display = "none";
    this.item = null;
};

IntendeeCell.prototype.show = function(item) {
    if (item !== this.item) {
        this.item = item;
        if (item.subscribe) {
            item.subscribe("nickname", this.selfUpdate);
            item.subscribe("icon", this.selfUpdate);
            item.subscribe("emblem", this.selfUpdate);
            item.subscribe("mind", this.selfUpdate);
        }

        this.emblem.style.display = "block";
        this.desc.style.display = "block";
        this.img.style.display = "block";
        this.desc.style.fontStyle = (item === window.me ? "italic" : "normal");
        this.desc.style.fontWeight = (item === window.me ? "bold" : "normal");
    }

    this.img.src = item.icon || this.defaultImg;
    this.emblem.src = item.emblem || this.defaultEmblem;
    this.desc.innerHTML = item.nickname  || this.defaultDesc;
    this.desc.style.height = item.mind ? "60px" : "30px";
    if (item.mind) this.desc.innerHTML += "<br/><quote>" + item.mind + "</quote>";
};



function MessageCell(area) {
    if (!area) return;
    ImgDescCell.call(this, area);
    this.item = null;
    this.img.className += 'msgPic';
    this.desc.className += 'msgDesc';

    var self =this;
    this.selfUpdate = function() { self.show(self.item); };
    this.img.onmouseover = function () { self.onClick(); } ;
    this.desc.onmouseover = function () { self.onClick(); } ;
}

MessageCell.prototype = new ImgDescCell();
MessageCell.prototype.constructor = MessageCell;


MessageCell.prototype.gap = 40;

MessageCell.prototype.defaultImg = "./sexy_gui/images/star.gif";

MessageCell.prototype.defaultDesc = "";


MessageCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap;
    
    this.img.style.opacity = inFactor;
    this.desc.style.opacity = inFactor;

    this.img.style.bottom = ((x-1) * gap) + "px";
    this.desc.style.bottom = ((x-1) * gap) + "px";
};

MessageCell.prototype.getOpeningSize = function(area) {
    return area.clientHeight / MessageCell.prototype.gap;
}

MessageCell.prototype.hide = function() {
    if (!this.item) return;
    if (this.item.unsubscribe) {
        this.item.unsubscribe("intendee", this.selfUpdate);
        this.item.unsubscribe("content", this.selfUpdate);
    }
    this.item = null;
    this.img.style.display = "none";
    this.desc.style.display = "none";
};

MessageCell.prototype.show = function(item) {
    if (item !== this.item) {
        this.item = item;
        if (item.subscribe) {
            item.subscribe("content", this.selfUpdate);
            item.subscribe("intendee", this.selfUpdate);
        }

        this.img.style.display = "block";
        this.desc.style.display = "block";
    }
    var from = item.from && Autobus.singleton.tagsonomy.getOr(item.from, null);
    this.img.src = item.icon || this.defaultImg;
    this.desc.innerHTML = item.content || this.defaultDesc;

};

MessageCell.prototype.onClick = function() {
    showContextForm(this);
}

MessageCell.prototype.gap = 50;

var revolutionOfIntendees = new Revolution();
var revolutionOfMessages =  new Revolution();
var iTrap = new Trap();
var mTrap = new Trap();

function uiInit() {
    revolutionOfIntendees.init(document.getElementById("intendeesArea"), IntendeeCell, 50);
    revolutionOfMessages.init(document.getElementById("msgsArea"), MessageCell, 50);

    iTrap.bind(document.getElementById("intendeesTrap"));
    iTrap.onResume = function() { revolutionOfIntendees.resume(); }
    iTrap.onPause = function() { revolutionOfIntendees.friction=null; }
    iTrap.iterate = function() {
        Trap.prototype.iterate.call(this);
        revolutionOfIntendees.friction = this.down ? - this.dx / IntendeeCell.prototype.gap : null;
        return this.down;
    }

    mTrap.bind(document.getElementById("msgsTrap"));
    mTrap.onResume = function() { revolutionOfMessages.resume(); }
    mTrap.onPause = function() { revolutionOfMessages.friction=null; }
    mTrap.iterate = function() {
        Trap.prototype.iterate.call(this);
        revolutionOfMessages.friction = this.down ? this.dy / MessageCell.prototype.gap : null;
        return this.down;
    }

    document.getElementById("intendeesBack").onmousedown = function() { revolutionOfIntendees.friction = -0.2; revolutionOfIntendees.resume(); };
    document.getElementById("intendeesBack").onmouseup = function() { revolutionOfIntendees.friction = null; };
    document.getElementById("intendeesForward").onmousedown = function() { revolutionOfIntendees.friction = 0.2; revolutionOfIntendees.resume(); };
    document.getElementById("intendeesForward").onmouseup = function() { revolutionOfIntendees.friction = null; };
 
    document.getElementById("meName").onblur = function() { setNickname(document.getElementById('meName').value); }

    sound.preload("sexy_gui/sound/freesound__soaper__footsteps_1.mp3", "incoming");
    sound.preload("sexy_gui/sound/freesound__FreqMan__011_Door_opens_and_shuts.mp3", "leaving");
    sound.preload("sexy_gui/sound/freesound__acclivity__Goblet_G_Medium.mp3", "blah!");
}

function puts(msg, pic) {
    revolutionOfMessages && revolutionOfMessages.unshift({"from": "log", "content": msg});
}
