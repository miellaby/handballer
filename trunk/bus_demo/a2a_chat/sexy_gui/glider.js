function Glider() {
   Anim.call(this);
   this.begin = this.end = 0.5;
   this.element = null;
   this.opacity = this.opacity1 = 0;
}
Glider.prototype = new Anim();
Glider.prototype.init = function(element, side, dimension) {
  this.element = element;
  element.style.display = 'none';
  this.side = side || "left";
  this.dimension = dimension || "width";
}

Glider.prototype.iterate = function() {
   var hidden = false;
   if (this.opacity < this.opacity1) {
     if (!this.opacity) hidden = true;
     this.opacity = this.opacity1;
   } else if (this.opacity != this.opacity1) {
     this.opacity = (this.opacity + this.opacity1) / 2;
     if (Math.abs(this.opacity - this.opacity1) < 0.01) this.opacity = this.opacity1;
   }

   this.element.style.opacity = this.opacity;
   if (!this.opacity)
       this.element.style.display = 'none';
   else if (hidden)
       this.element.style.display = 'block';

   return !(this.opacity == this.opacity1);
}

Glider.prototype.update = function(begin, end, moving) {
    if (begin != this.begin || end != this.end) {
        this.begin = begin;
        this.end = end;
        this.element.style[this.side] = this.begin * 100 + "%";
        this.element.style[this.dimension] = ((this.end - this.begin) * 100) + "%";
    }
    if ((moving ? 1 : 0) != this.opacity1) {
        this.opacity1 = (moving ? 1 : 0);
        this.resume();
    }
}  
