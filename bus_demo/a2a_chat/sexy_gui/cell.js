function ImgDescCell() {
    this.item = null;
    this.img = document.createElement('img');
    this.desc = document.createElement('p');
    this.img.className += this.cssClass + 'Pic';
    this.desc.className += this.cssClass + 'Desc';
    this.img.style.display = "none";
    this.desc.style.display = "none";
    if (!this.area) return;
    this.area.appendChild(this.desc);
    this.area.appendChild(this.img);
}

ImgDescCell.prototype.constructor = ImgDescCell;
ImgDescCell.prototype.cssClass = "cell";

ImgDescCell.prototype.show = function(item) { };

ImgDescCell.prototype.setCoords = function(inFactor, x) { } ;

ImgDescCell.prototype.hide = function() { };
