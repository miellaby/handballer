function ImgDescCell(img, label) {
    this.img = img;
    this.label = label;
     
    if (this.img) {
        var self = this;
        this.img.onclick = function () { self.item.onclick() ; } ;
        this.img.onmouseover = function() { this.className = 'tvover'; } ;
        this.img.onmouseout = function() { this.className = 'tvout'; } ;
    }

    this.item;
}

ImgDescCell.prototype.hide = function() {
    this.item = null;
    this.img.style.display = "none";
    this.label.style.display = "none";
};

ImgDescCell.prototype.show = function(item) {
    this.item = item; 
    if (this.img) {
        this.img.src = (item["img"] ? item.img : this.defaultImg);
        this.label.style.display = "inline";
    }
    if (this.label) {
        this.label.innerHTML = (item["desc"] !== undefined ? item.desc : this.defaultDesc);;
        this.img.style.display = "inline";
    }
};

ImgDescCell.prototype.setX = function(x) {
    var inFactor = this.item["inFactor"] !== undefined ? this.item.inFactor : 1;
    this.img.style.top = ((inFactor - 1.0) * this.height) + "px";
    this.img.style.left = x + "px";
    this.label.style.top = (inFactor * this.height) + "px";
    this.label.style.left = x + "px";
};

ImgDescCell.prototype.height = 80;
ImgDescCell.prototype.defaultImg = "./pic/blank.gif";
ImgDescCell.prototype.defaultDesc = "";
