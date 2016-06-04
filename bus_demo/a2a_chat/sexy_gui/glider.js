// Small bar
function Glider() {
  Anim.call(this);
  this.duration = 400.0
  this.begin = this.end = 0.5;
  this.element = null;
  this.opacity = this.opacity0 = this.opacity1 = 0;
}
Glider.prototype = new Anim();
Glider.prototype.init = function (element, side, dimension) {
  this.element = element;
  element.style.display = 'none';
  this.side = side || "left";
  this.dimension = dimension || "width";
}

Glider.prototype.iterate = function (progress) {
  this.opacity = this.opacity0 + (this.opacity1 - this.opacity0) * progress;
  this.element.style.opacity = this.opacity;
  if (progress == 1 && this.opacity === 0) {
    this.element.style.display = 'none';
  }
  return progress < 1;
}

Glider.prototype.update = function (begin, end, moving) {
  if (begin != this.begin || end != this.end) {
    this.begin = begin;
    this.end = end;
    this.element.style[this.side] = this.begin * 100 + "%";
    this.element.style[this.dimension] = ((this.end - this.begin) * 100) + "%";
    moving = true;
  }
  if ((moving ? 1 : 0) != this.opacity1) {
    this.opacity1 = (moving ? 1 : 0);
    if (moving) {
      this.element.style.display = 'block';
    }
    this.restart();
  }
}  
