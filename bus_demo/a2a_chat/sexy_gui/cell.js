function ImgDescCell(img, desc) {
    this.img = img;
    this.desc = desc;
     
    if (this.img) {
        var self = this;
        this.img.setAttribute('initClass', this.img.className);
        this.img.onclick = function () { self.item.onclick() ; } ;
        this.img.onmouseover = function() { this.className += 'Over'; } ;
        this.img.onmouseout = function() { this.className = this.getAttribute('initClass'); } ;
    }
    this.hide();
}

ImgDescCell.prototype.hide = function() {
    this.item = null;
    if (this.img) this.img.style.display = "none";
    if (this.desc) this.desc.style.display = "none";
};

ImgDescCell.prototype.show = function(item) {
    this.item = item; 
    if (this.img) {
        this.img.src = (item["img"] ? item.img : this.defaultImg);
        this.desc.style.display = "inline";
    }
    if (this.desc) {
        this.desc.innerHTML = (item["desc"] !== undefined ? item.desc : this.defaultDesc);;
        this.img.style.display = "inline";
    }
};

ImgDescCell.prototype.setCoords = function(inFactor, x) {
    // .log("inFactor " + inFactor + "; x " + x);
    this.img.style.top = ((inFactor - 1.0) * this.height) + "px";
    this.img.style.left = (x * this.itemOffset) + "px";
    this.desc.style.top = (inFactor * this.height) + "px";
    this.desc.style.left = (x * this.itemOffset) + "px";
};

ImgDescCell.prototype.height = 140;
ImgDescCell.prototype.itemOffset = 90;
ImgDescCell.prototype.defaultImg = "./images/blank.gif";
ImgDescCell.prototype.defaultDesc = "";

ImgDescCell.extract = function(imgPrefix, descPrefix, howMany) {
    var cells = [];
    for (var i = 0; i < howMany; i++) {
        var img = document.getElementById(imgPrefix + i), desc = document.getElementById(descPrefix + i);
        cells.push(new ImgDescCell(img, desc));
    }
    return cells;
}

