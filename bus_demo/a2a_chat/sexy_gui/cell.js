function ImgDescCell(areaElement) {
    if (!areaElement) return;
    this.item = null;
    this.img = document.createElement('img');
    this.desc = document.createElement('p');
    this.img.style.display = "none";
    this.desc.style.display = "none";
    areaElement.appendChild(this.img);
    areaElement.appendChild(this.desc);

    var self =this;
    this.selfUpdate = function() { self.show(self.item); };
    this.img.onclick = function () { self.item.onclick() ; } ;
}

ImgDescCell.prototype.visible = function(area, x) {
    x -=1.0;
    return (x > this.getOpeningSize(area) ? 1
            : (x < - 1.0 ? - 1 : 0));
}

ImgDescCell.prototype.show = function(item) { };

ImgDescCell.prototype.setCoords = function(inFactor, x) { } ;

ImgDescCell.prototype.hide = function() { };
