// little helpers
function centerByMargin(img) {
    var s = img.style;
    s.marginLeft = (- parseInt(s.width) / 2) + "px";
    s.marginTop =  (- parseInt(s.height) / 2) + "px";
}

// ======================================================================
// Intendee cell
// ======================================================================

function IntendeeCell() {
    ImgDescCell.call(this);
    this.item = null;
    this.img.className += 'intendeePic';
    this.desc.className += 'intendeeDesc';

    this.emblem = document.createElement('img');
    this.emblem.style.display = 'none';
    this.emblem.className += 'intendeeEmblem';
    this.area.appendChild(this.emblem);

    var self =this;
    this.selfUpdate = function(name, value) { self.show(self.item, name); };
    this.img.onclick = function () { self.onClick(); } ;
    this.desc.onclick = function () { self.onClick(); } ;
    if (this.trap) { this.trap.bindTarget(this.img); }
}

IntendeeCell.prototype = new ImgDescCell();

IntendeeCell.prototype.constructor = IntendeeCell;
IntendeeCell.prototype.area = null;
IntendeeCell.prototype.trap = null;
IntendeeCell.prototype.gap = 130;
IntendeeCell.prototype.height = 130;
IntendeeCell.prototype.defaultImg = "./images/guest.gif";
IntendeeCell.prototype.defaultName = "...";
IntendeeCell.prototype.defaultEmblem = "./images/blank.gif";

IntendeeCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap, height = this.height;
    this.img.style.top = ((inFactor - 0.5) * height) + "px";
    this.img.style.left = ((x-1) * gap + 49.5) + "px";
    this.emblem.style.top = ((inFactor - 1.0) * height) + "px";
    this.emblem.style.left = ((x-1) * gap) + "px";
    this.desc.style.top = (inFactor * height) + "px";
    this.desc.style.left = ((x-1) * gap) + "px";
};

// to call like this:
// var o = IntendeeCell.prototype.getOpeningSize();
IntendeeCell.prototype.getOpeningSize = function() {
    return this.area.clientWidth / this.gap;
}

IntendeeCell.prototype.unbind = function() {
    if (this.item.unsubscribe) {
        this.item.unsubscribe("icon", this.selfUpdate);
        this.item.unsubscribe("nickname", this.selfUpdate);
        this.item.unsubscribe("emblem", this.selfUpdate);
        this.item.unsubscribe("mind", this.selfUpdate);
        this.item.unsubscribe("color", this.selfUpdate);
        this.item.unsubscribe("away", this.selfUpdate);
        this.item.unsubscribe("typing", this.selfUpdate);
        this.item.unsubscribe("watching", this.selfUpdate);
    }
};

IntendeeCell.prototype.hide = function() {
    if (!this.item) return;
    this.unbind();
    this.item = null;
    this.emblem.style.display = "none";
    this.img.style.display = "none";
    this.desc.style.display = "none";
};

IntendeeCell.prototype.show = function(item, change) {
    if (item !== this.item) {
        if (this.item) this.unbind();
        this.item = item;
        if (item.subscribe) {
            item.subscribe("icon", this.selfUpdate);
            item.subscribe("nickname", this.selfUpdate);
            item.subscribe("emblem", this.selfUpdate);
            item.subscribe("mind", this.selfUpdate);
            item.subscribe("color", this.selfUpdate);
            item.subscribe("away", this.selfUpdate);
            item.subscribe("typing", this.selfUpdate);
            item.subscribe("watching", this.selfUpdate);
        }

        this.emblem.style.display = "block";
        this.desc.style.display = "block";
        this.img.style.display = "block";
        this.desc.style.fontStyle = (item === a2ac.me ? "italic" : "normal");
        this.desc.style.fontWeight = (item === a2ac.me ? "bold" : "normal");
    }
    if (!change || change == "icon")
        imgBoxURL(this.img, item.icon || this.defaultImg, 96, 130, centerByMargin);
    if (!change || change == "emblem")
        this.emblem.src = item.emblem || this.defaultEmblem;

    if (!change || change != "icon" && change != "emblem") {
        // change = nickname, desc, color, etc.
        var desc = (item.nickname || this.defaultName);
        
        if (item.mind) desc += "<quote><br/>" + item.mind + "</quote>";
        if (item.away)
            desc += "<br/><small>(away)</small>";
        else if (item.typing)
            desc += "<br/><small>typing</small>";
        else if (item.watching)
            desc += "<br/><small>watching</small>";
        // this.desc.style.height = item.mind ? "90px" : "60px";

        this.desc.innerHTML = desc;
        this.desc.style.color = item.color;
    }
};

// ======================================================================
// Message cell
// ======================================================================

function MessageCell() {
    ImgDescCell.call(this);
    this.item = null;
    this.img.className += 'msgPic';
    this.desc.className += 'msgDesc';

    var self =this;
    this.selfUpdate = function(name, value) { self.show(self.item, name); };
    this.img.onclick = function () { self.onClick(); } ;
    this.desc.onclick = function () { self.onClick(); } ;
    if (this.trap) this.trap.bindTarget(this.img);
}

MessageCell.prototype = new ImgDescCell();
MessageCell.prototype.constructor = MessageCell;
MessageCell.prototype.area = null;
MessageCell.prototype.trap = null;
MessageCell.prototype.gap = 53;
MessageCell.prototype.defaultImg = "./images/star.png";
MessageCell.prototype.defaultDesc = "...";

MessageCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap;
    
    this.img.style.opacity = inFactor;
    this.desc.style.opacity = inFactor;

    this.img.style.bottom = ((x-1) * gap) + "px";
    this.desc.style.bottom = ((x-1) * gap) + "px";
};


// to call like this:
// var o = MessageCell.prototype.getOpeningSize();
MessageCell.prototype.getOpeningSize = function() {
    return (this.area === document.body ? window.innerHeight : this.area.clientHeight) / this.gap;
}

MessageCell.prototype.unbind = function() {
    if (this.item.unsubscribe) {
        this.item.unsubscribe("from", this.selfUpdate);
        this.item.unsubscribe("content", this.selfUpdate);
        this.item.unsubscribe("icon", this.selfUpdate);
        this.item.unsubscribe("color", this.selfUpdate);

        if (this.item.intendee) {
            this.item.intendee.unsubscribe("icon", this.selfUpdate);
            this.item.intendee.unsubscribe("color", this.selfUpdate);
        }
    }
}

MessageCell.prototype.hide = function() {
    if (!this.item) return;
    this.unbind();
    this.item = null;
    this.img.style.display = "none";
    this.desc.style.display = "none";
};

MessageCell.prototype.show = function(item, change) {
    // if not yet done, find the intendee object corresponding to this message
    if (!item.intendee)
        item.intendee = item.from && Autobus.singleton.tagsonomy.getOr(item.from, null);

    if (item !== this.item) {
        if (this.item) this.unbind();
        this.item = item;
        if (item.subscribe) {
            item.subscribe("from", this.selfUpdate);
            item.subscribe("content", this.selfUpdate);
            item.subscribe("icon", this.selfUpdate);
            item.subscribe("color", this.selfUpdate);
        }
        if (item.intendee) {
            item.intendee.subscribe("icon", this.selfUpdate);
            item.intendee.subscribe("color", this.selfUpdate);
        }

        this.img.style.display = "block";
        this.desc.style.display = "block";
    }
    this.img.src = item.icon || ( item.intendee && item.intendee.icon ) || this.defaultImg;
    this.desc.style.color = item.color || ( item.intendee && item.intendee.color );
    this.desc.innerHTML = item.content || this.defaultDesc;

};

// ======================================================================
// Event cell
// ======================================================================
function EventCell() {
    MessageCell.call(this);
}

EventCell.prototype = new MessageCell();
EventCell.prototype.constructor = EventCell;
EventCell.prototype.area = null;
EventCell.prototype.trap = null;

EventCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap;
    
    this.img.style.opacity = inFactor;
    this.desc.style.opacity = inFactor;

    this.img.style.top = (x * gap) + "px";
    this.desc.style.top = (x * gap) + "px";
};
