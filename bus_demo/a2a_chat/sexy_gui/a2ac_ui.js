function IntendeeCell(img, desc) {
    ImgDescCell.call(this, img, desc);

    this.img.style.display = "none";
    this.desc.style.display = "none";
}

IntendeeCell.prototype = new ImgDescCell();
IntendeeCell.prototype.constructor = IntendeeCell;

IntendeeCell.prototype.itemOffset = 130;

IntendeeCell.prototype.height = 130;

IntendeeCell.prototype.defaultImg = "./images/blank.gif";

IntendeeCell.prototype.defaultDesc = "???";

IntendeeCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var offset = this.itemOffset, height = this.height;
    this.img.style.top = ((inFactor - 1.0) * height) + "px";
    this.img.style.left = ((x-1) * offset) + "px";
    this.desc.style.top = (inFactor * height) + "px";
    this.desc.style.left = ((x-1) * offset) + "px";
};


IntendeeCell.prototype.hide = function() {
    if (!this.item) return;
    this.item.unsubscribe("icon", this.selfUpdate);
    this.item.unsubscribe("nickname", this.selfUpdate);
    this.item = null;
};

IntendeeCell.prototype.show = function(item) {
    if (item !== this.item) {
        this.item = item;
        item.subscribe("nickname", this.selfUpdate);
        item.subscribe("icon", this.selfUpdate);

        this.desc.style.display = "block";
        this.img.style.display = "block";
        this.desc.style.fontStyle = (item === window.me ? "italic" : "normal");
    }

    this.img.src = item.icon || this.defaultImg;
    this.desc.innerHTML = item.nickname  || this.defaultDesc;
};

function MessageCell(img, desc) {
    ImgDescCell.call(this, img, desc);

    this.img.style.display = "none";
    this.desc.style.display = "none";
}

MessageCell.prototype = new ImgDescCell();
MessageCell.prototype.constructor = MessageCell;


MessageCell.prototype.itemOffset = 40;

MessageCell.prototype.defaultImg = "./images/star.gif";

MessageCell.prototype.defaultDesc = "";


MessageCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var offset = this.itemOffset;
    
    this.img.style.opacity = inFactor;
    this.desc.style.opacity = inFactor;

    this.img.style.bottom = ((x-1) * offset) + "px";
    this.desc.style.bottom = ((x-1) * offset) + "px";
};


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

MessageCell.prototype.itemOffset = 50;
