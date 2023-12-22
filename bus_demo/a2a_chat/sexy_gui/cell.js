function ImgTextCell() {
    this.item = null;
    this.img = document.createElement('img');
    this.desc = document.createElement('p');
    this.img.className += this.cssClass + 'Pic';
    this.desc.className += this.cssClass + 'Text';
    this.img.style.display = "none";
    this.desc.style.display = "none";
    if (!this.area) return;
    this.area.appendChild(this.desc);
    this.area.appendChild(this.img);
}

ImgTextCell.prototype.constructor = ImgTextCell;
ImgTextCell.prototype.cssClass = "cell";

ImgTextCell.prototype.show = function(item) { };

ImgTextCell.prototype.setCoords = function(inFactor, x) { } ;

ImgTextCell.prototype.hide = function() { };
