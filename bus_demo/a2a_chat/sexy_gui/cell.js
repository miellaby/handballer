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
        this.desc.style.display = "block";
    }
    if (this.desc) {
        this.desc.innerHTML = (item["desc"] !== undefined ? item.desc : this.defaultDesc);;
        this.img.style.display = "block";
    }
};

ImgDescCell.prototype.height = null;
ImgDescCell.prototype.itemOffset = null;
ImgDescCell.prototype.defaultImg = "./images/blank.gif";
ImgDescCell.prototype.defaultDesc = "";

ImgDescCell.prototype.extract = function(imgPrefix, descPrefix, howMany) {
    var cells = [];
    for (var i = 0;; i++) {
        var img = document.getElementById(imgPrefix + i), desc = document.getElementById(descPrefix + i);
        if (!desc && !img) break;
        cells.push(new (this.constructor)(img, desc));
    }
    return cells;
}

