function ImgDescCell(areaElement) {
    if (!areaElement) return;
    this.img = document.createElement('img');
    this.desc = document.createElement('p');
    this.img.style.display = "none";
    this.desc.style.display = "none";
    areaElement.appendChild(this.desc);
    areaElement.appendChild(this.img);
}

ImgDescCell.prototype.visible = function(area, x) {
    x -=1.0;
    return (x > this.getOpeningSize(area) ? 1
            : (x < - 1.0 ? - 1 : 0));
}

ImgDescCell.prototype.show = function(item) { };

ImgDescCell.prototype.setCoords = function(inFactor, x) { } ;

ImgDescCell.prototype.hide = function() { };
