// ======================================================================
// Intendee cell
// ======================================================================

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
    this.img.onclick = function () { self.onClick(); } ;
    this.desc.onclick = function () { self.onClick(); } ;
    chat2.iTrap.bindTarget(this.img);
}

IntendeeCell.prototype = new ImgDescCell();
IntendeeCell.prototype.constructor = IntendeeCell;

IntendeeCell.prototype.gap = 130;

IntendeeCell.prototype.height = 130;

IntendeeCell.prototype.defaultImg = "./images/guest.gif";

IntendeeCell.prototype.defaultDesc = "???";

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
        this.item.unsubscribe("typing", this.selfUpdate);
        this.item.unsubscribe("watching", this.selfUpdate);
    }
    this.emblem.style.display = "none";
    this.img.style.display = "none";
    this.desc.style.display = "none";
    this.item = null;
};

function centerByMargin(img) {
    var s = img.style;
    s.marginLeft = (- parseInt(s.width) / 2) + "px";
    s.marginTop =  (- parseInt(s.height) / 2) + "px";
}

IntendeeCell.prototype.show = function(item) {
    if (item !== this.item) {
        this.item = item;
        if (item.subscribe) {
            item.subscribe("nickname", this.selfUpdate);
            item.subscribe("icon", this.selfUpdate);
            item.subscribe("emblem", this.selfUpdate);
            item.subscribe("mind", this.selfUpdate);
            item.subscribe("typing", this.selfUpdate);
            item.subscribe("watching", this.selfUpdate);
        }

        this.emblem.style.display = "block";
        this.desc.style.display = "block";
        this.img.style.display = "block";
        this.desc.style.fontStyle = (item === a2ac.me ? "italic" : "normal");
        this.desc.style.fontWeight = (item === a2ac.me ? "bold" : "normal");
    }

    imgBoxURL(this.img, item.icon || this.defaultImg, 99, 133, centerByMargin);
    this.emblem.src = item.emblem || this.defaultEmblem;
    var desc = item.nickname  || this.defaultDesc;
    if (item.away)
        desc += " <small><br/>(away)</small>";
    else if (item.watching || item.typing)
        desc += " <small><br/>" + ( item.typing ? " typing" : "" ) + ( item.watching ? " watching" : "") + "</small>";
    // this.desc.style.height = item.mind ? "90px" : "60px";
    if (item.mind) desc += "<br/><quote>" + item.mind + "</quote>";

    this.desc.innerHTML = desc;
};

// ======================================================================
// Message cell
// ======================================================================

function MessageCell(area) {
    if (!area) return;
    ImgDescCell.call(this, area);
    this.item = null;
    this.img.className += 'msgPic';
    this.desc.className += 'msgDesc';

    var self =this;
    this.selfUpdate = function() { self.show(self.item); };
    this.img.onclick = function () { self.onClick(); } ;
    this.desc.onclick = function () { self.onClick(); } ;
    chat2.mTrap.bindTarget(this.img);
}

MessageCell.prototype = new ImgDescCell();
MessageCell.prototype.constructor = MessageCell;


MessageCell.prototype.gap = 43;

MessageCell.prototype.defaultImg = "./images/star.gif";

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
    return (area === document.body ? window.innerHeight : area.clientHeight) / MessageCell.prototype.gap;
}

MessageCell.prototype.hide = function() {
    if (!this.item) return;
    if (this.item.unsubscribe) {
        this.item.unsubscribe("from", this.selfUpdate);
        this.item.unsubscribe("content", this.selfUpdate);
        this.item.unsubscribe("icon", this.selfUpdate);

        if (this.item.intendee) this.item.intendee.unsubscribe("icon", this.selfUpdate);
    }
    this.item = null;
    this.img.style.display = "none";
    this.desc.style.display = "none";
};

MessageCell.prototype.show = function(item) {
    // if not yet done, find the intendee object corresponding to this message
    if (!item.intendee)
        item.intendee = item.from && Autobus.singleton.tagsonomy.getOr(item.from, null);

    if (item !== this.item) {
        this.item = item;
        if (item.subscribe) {
            item.subscribe("content", this.selfUpdate);
            item.subscribe("from", this.selfUpdate);
            item.subscribe("icon", this.selfUpdate);
        }
        if (item.intendee) item.intendee.subscribe("icon", this.selfUpdate);

        this.img.style.display = "block";
        this.desc.style.display = "block";
    }
    this.img.src = item.icon || ( item.intendee && item.intendee.icon ) || this.defaultImg;
    this.desc.innerHTML = item.content || this.defaultDesc;

};

MessageCell.prototype.gap = 50;
