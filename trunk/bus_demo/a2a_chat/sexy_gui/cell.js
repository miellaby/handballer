function ImgDescCell() {
    this.img = document.createElement('img');
    this.desc = document.createElement('p');
    this.img.style.display = "none";
    this.desc.style.display = "none";
    if (!this.area) return;
    this.area.appendChild(this.desc);
    this.area.appendChild(this.img);
}

ImgDescCell.prototype.show = function(item) { };

ImgDescCell.prototype.setCoords = function(inFactor, x) { } ;

ImgDescCell.prototype.hide = function() { };
