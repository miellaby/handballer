// little helpers
function centerByMargin(img) {
    var s = img.style;
    s.marginLeft = (- parseInt(s.width) / 2) + "px";
    s.marginTop = (- parseInt(s.height) / 2) + "px";
}

// ======================================================================
// Intendee cell
// ======================================================================

function IntendeeCell() {
    ImgTextCell.call(this);
    this.emblem = document.createElement('img');
    this.emblem.style.display = 'none';
    this.emblem.className += 'intendeeEmblem';
    this.area.appendChild(this.emblem);

    var self = this;
    this.selfUpdate = function (name, value) { self.show(self.item, name); };
    this.img.onclick = function () { self.onClick(); };
    this.desc.onclick = function () { self.onClick(); };
    this.img.style.filter = 'drop-shadow(0 0 0.75rem ' + 'gray' + ')';
    if (this.trap) { this.trap.bindTarget(this.img); }
}

IntendeeCell.prototype = new ImgTextCell();
IntendeeCell.prototype.constructor = IntendeeCell;
IntendeeCell.prototype.cssClass = "intendee";
IntendeeCell.prototype.area = null;
IntendeeCell.prototype.trap = null;
IntendeeCell.prototype.gap = 120;
IntendeeCell.prototype.height = 100;
IntendeeCell.prototype.defaultImg = "./images/person.svg";
IntendeeCell.prototype.defaultColor = 'gray';
IntendeeCell.prototype.defaultName = "...";
IntendeeCell.prototype.defaultEmblem = "./images/blank.gif";

IntendeeCell.prototype.setCoords = function (inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap, height = this.height;
    this.img.style.top = ((inFactor - 0.5) * height) + "px";
    this.img.style.left = ((x - 1) * gap + 49.5) + "px";
    this.emblem.style.top = ((inFactor - 1.0) * height) + "px";
    this.emblem.style.left = ((x - 1) * gap) + "px";
    this.desc.style.top = (inFactor * height) + "px";
    this.desc.style.left = ((x - 1) * gap) + "px";
};

// to call like this:
// var o = IntendeeCell.prototype.getOpeningSize();
IntendeeCell.prototype.getOpeningSize = function () {
    return this.area.clientWidth / this.gap;
}

IntendeeCell.prototype.unbind = function () {
    if (this.item.unsubscribe) {
        this.item.unsubscribe("icon", this.selfUpdate);
        this.item.unsubscribe("nickname", this.selfUpdate);
        this.item.unsubscribe("emblem", this.selfUpdate);
        this.item.unsubscribe("mind", this.selfUpdate);
        this.item.unsubscribe("color", this.selfUpdate);
        this.item.unsubscribe("away", this.selfUpdate);
        this.item.unsubscribe("activity", this.selfUpdate);
    }
};

IntendeeCell.prototype.hide = function () {
    if (!this.item) return;
    this.unbind();
    this.item = null;
    this.emblem.style.display = "none";
    this.img.style.display = "none";
    this.desc.style.display = "none";
};

IntendeeCell.prototype.show = function (item, change) {
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
            item.subscribe("activity", this.selfUpdate);
        }

        this.emblem.style.display = "block";
        this.desc.style.display = "block";
        this.img.style.display = "block";
        this.desc.style.fontStyle = (item === a2ac.me ? "italic" : "normal");
        this.desc.style.fontWeight = (item === a2ac.me ? "bold" : "normal");
    }
    if (!change || change == "icon")
        imgBoxURL(this.img, item.icon || this.defaultImg, 116, 130, centerByMargin);
    if (!change || change == "emblem")
        this.emblem.src = item.emblem || this.defaultEmblem || '';

    if (!change || change != "icon" && change != "emblem") {
        // change = nickname, desc, color, etc.
        this.desc.innerHTML = (item.nickname || this.defaultName);
        if (item.mind) {
            var mindElement = document.createElement('quote');
            chat2.creole.parse(mindElement, item.mind)
            this.desc.appendChild(mindElement);
        }
        if (item.activity != "connected") {
            this.desc.innerHTML +=
                "<small>" + item.activity + "</small>";
        }
        // this.desc.style.height = item.mind ? "90px" : "60px";
        let color = item.color || this.defaultColor;
        var lightColor = RGBColor.lighter(color).toName();
        this.desc.style.color = '#333';
        this.desc.style.textShadow = "1px 2px 3px " + lightColor;
        this.img.style.filter = 'drop-shadow(0 0 0.5rem ' + color + ')';
    }
};

// ======================================================================
// Message cell
// ======================================================================

function MessageCell() {
    ImgTextCell.call(this);
    this.selfUpdate = (name, value) => this.show(this.item, name);
    this.showIntendee = () => MessageCell.prototype.showIntendee.call(this);
    this.img.onclick = () => this.onClick();
    this.desc.onclick = () => this.onClick();
    if (this.trap) this.trap.bindTarget(this.img);
}

MessageCell.prototype = new ImgTextCell();
MessageCell.prototype.constructor = MessageCell;
MessageCell.prototype.cssClass = "msg";
MessageCell.prototype.area = null;
MessageCell.prototype.trap = null;
MessageCell.prototype.gap = 73;
MessageCell.prototype.defaultImg = "";
MessageCell.prototype.defaultText = "...";
MessageCell.prototype.defaultColor = "black";

MessageCell.prototype.setCoords = function (inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap;

    this.img.style.opacity = inFactor;
    this.desc.style.opacity = inFactor;

    this.img.style.bottom = ((x - 1) * gap) + "px";
    this.desc.style.bottom = ((x - 1) * gap) + "px";
};


// to call like this:
// var o = MessageCell.prototype.getOpeningSize();
MessageCell.prototype.getOpeningSize = function () {
    return (this.area === document.body ? window.innerHeight : this.area.clientHeight) / this.gap;
}


MessageCell.prototype.unbind = function () {
    if (this.item.unsubscribe) {
        this.item.unsubscribe("from", this.selfUpdate);
        this.item.unsubscribe("content", this.selfUpdate);
        this.item.unsubscribe("icon", this.selfUpdate);
        this.item.unsubscribe("color", this.selfUpdate);

        if (this.item.intendee) {
            this.item.intendee.unsubscribe("icon", this.showIntendee);
            this.item.intendee.unsubscribe("color", this.showIntendee);
        }
    }
}

MessageCell.prototype.hide = function () {
    if (!this.item) return;
    this.unbind();
    this.item = null;
    this.img.style.display = "none";
    this.desc.style.display = "none";
};

MessageCell.prototype.showIntendee = function () {
    let item = this.item;
    let intendee = item.intendee;
    this.img.src = item.icon || intendee && intendee.icon || this.defaultImg || '';
    let color = item.color || intendee && intendee.color || this.defaultColor;
    let lighter = RGBColor.lighter(color).toName();
    this.desc.style.color = color;
    this.desc.style.textShadow = "1px 2px 3px " + lighter;
    this.img.style.filter = 'drop-shadow(0 0 0.5rem ' + color + ')';
}

MessageCell.prototype.show = function (item, change) {
    if (!("intendee" in item)) { // if not done
        // find the intendee object corresponding to this message
        requestAnimationFrame(() => {
            let intendee = item.from && Autobus.factory().index.getOr(item.from, null);
            item.setted('intendee', intendee);
            item.intendee.subscribe("icon", this.showIntendee);
            item.intendee.subscribe("color", this.showIntendee);
            this.showIntendee();
        });
    }

    if (item !== this.item) {
        this.item = item;
        if (item.subscribe) {
            item.subscribe("from", this.selfUpdate);
            item.subscribe("content", this.selfUpdate);
            item.subscribe("icon", this.selfUpdate);
            item.subscribe("color", this.selfUpdate);
        }
        if (item.intendee) {
            item.intendee.subscribe("icon", this.showIntendee);
            item.intendee.subscribe("color", this.showIntendee);
        }

        this.img.style.display = "block";
        this.desc.style.display = "block";
    }
    
    this.showIntendee();
    if (item.content) {
        this.desc.innerHTML = ''
        chat2.creole.parse(this.desc, item.content);
    } else {
        this.desc.innerHTML = this.defaultText;
    }
};

// ======================================================================
// Event cell
// ======================================================================
function EventCell() {
    MessageCell.call(this);
}

EventCell.prototype = new MessageCell();
EventCell.prototype.constructor = EventCell;
EventCell.prototype.cssClass = "event";
EventCell.prototype.area = null;
EventCell.prototype.trap = null;

EventCell.prototype.setCoords = function (inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var gap = this.gap;

    this.img.style.opacity = inFactor;
    this.desc.style.opacity = inFactor;

    this.img.style.top = ((x - 1) * gap) + "px";
    this.desc.style.top = ((x - 1) * gap) + "px";
};

EventCell.prototype.getOpeningSize = function () {
    return 10;
}
