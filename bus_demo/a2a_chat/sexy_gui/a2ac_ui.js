function IntendeeCell(img, desc) {
    ImgDescCell.call(this, img, desc);
}
IntendeeCell.prototype = new ImgDescCell();
IntendeeCell.prototype.constructor = IntendeeCell;
IntendeeCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var offset = (this.itemOffset ? this.itemOffset : this.img.width + 10), height = (this.height ? this.height : this.img.height);
    this.img.style.top = ((inFactor - 1.0) * height) + "px";
    this.img.style.left = ((x-1) * offset) + "px";
    this.desc.style.top = (inFactor * height) + "px";
    this.desc.style.left = ((x-1) * offset) + "px";
};

function MessageCell(img, desc) {
    ImgDescCell.call(this, img, desc);
}
MessageCell.prototype = new ImgDescCell();
MessageCell.prototype.constructor = MessageCell;
MessageCell.prototype.setCoords = function(inFactor, x) {
    //console.log("inFactor " + inFactor + "; x " + x);
    var offset = this.itemOffset;
    
    this.img.style.opacity = inFactor;
    this.img.style.bottom = ((x-1) * offset) + "px";
    
    this.desc.style.opacity = inFactor;
    this.desc.style.bottom = ((x-1) * offset) + "px";
};
MessageCell.prototype.itemOffset = 50;
