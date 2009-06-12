function IntendeeCell(area) {
    if (!area) return;
    ImgDescCell.call(this, area);
    this.img.className += 'intendeePic';
    this.desc.className += 'intendeeDesc';
}

IntendeeCell.prototype = new ImgDescCell();
IntendeeCell.prototype.constructor = IntendeeCell;

IntendeeCell.prototype.gap = 130;

IntendeeCell.prototype.height = 130;

IntendeeCell.prototype.defaultImg = "./sexy_gui/images/guest.gif";

IntendeeCell.prototype.defaultDesc = "???";

IntendeeCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap, height = this.height;
    this.img.style.top = ((inFactor - 1.0) * height) + "px";
    this.img.style.left = ((x-1) * gap) + "px";
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
    }
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
        }

        this.desc.style.display = "block";
        this.img.style.display = "block";
        this.desc.style.fontStyle = (item === window.me ? "italic" : "normal");
    }

    this.img.src = item.icon || this.defaultImg;
    this.desc.innerHTML = item.nickname  || this.defaultDesc;
};



function MessageCell(area) {
    if (!area) return;
    ImgDescCell.call(this, area);
    this.img.className += 'msgPic';
    this.desc.className += 'msgDesc';
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

MessageCell.prototype.gap = 50;
