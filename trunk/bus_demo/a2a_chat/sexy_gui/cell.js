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
    //console.log("inFactor " + inFactor + "; x " + x);
    var offset = (this.itemOffset ? this.itemOffset : this.img.width + 10), height = (this.height ? this.height : this.img.height);
    this.img.style.top = ((inFactor - 1.0) * height) + "px";
    this.img.style.left = ((x-1) * offset) + "px";
    this.desc.style.top = (inFactor * height) + "px";
    this.desc.style.left = ((x-1) * offset) + "px";
};

ImgDescCell.prototype.height = null;
ImgDescCell.prototype.itemOffset = null;
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

