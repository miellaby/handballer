function ImgDescCell(img, desc) {
    this.img = img;
    this.desc = desc;
    this.item = null;

    var self =this;
    this.selfUpdate = function() { self.show(self.item); };
     
    if (this.img) {
        this.img.setAttribute('initClass', this.img.className);
        this.img.onclick = function () { self.item.onclick() ; } ;
        this.img.onmouseover = function() { this.className += 'Over'; } ;
        this.img.onmouseout = function() { this.className = this.getAttribute('initClass'); } ;
    }
    if (this.img) this.img.style.display = "none";
    if (this.desc) this.desc.style.display = "none";
}

ImgDescCell.prototype.show = function(item) { };

ImgDescCell.prototype.setCoords = function(inFactor, x) { } ;

ImgDescCell.prototype.hide = function() { };

ImgDescCell.prototype.height = null;

ImgDescCell.prototype.itemOffset = null;

ImgDescCell.prototype.extract = function(imgPrefix, descPrefix, howMany) {
    var cells = [];
    for (var i = 0;; i++) {
        var img = document.getElementById(imgPrefix + i), desc = document.getElementById(descPrefix + i);
        if (!desc && !img) break;
        cells.push(new (this.constructor)(img, desc));
    }
    return cells;
}

