function Glider() {
   Anim.call(this);
   this.element = null;
   this.begin = this.begin1 = 0.5;
   this.end = this.end1 = 0.5;
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
   if (this.begin != this.begin1) {
     this.begin = (this.begin + this.begin1) / 2 ;
     if (Math.abs(this.begin - this.begin1) < 0.01) this.begin = this.begin1;
   }
   if (this.end !=  this.end1) {
     this.end = (this.end + this.end1) / 2;
     if (Math.abs(this.end - this.end1) < 0.01) this.end = this.end1;
   }
   if (this.opacity < this.opacity1) {
     if (!this.opacity) hidden = true;
     this.opacity = this.opacity1;
   } else if (this.opacity != this.opacity1) {
     this.opacity = (this.opacity + this.opacity1) / 2;
     if (Math.abs(this.opacity - this.opacity1) < 0.01) this.opacity = this.opacity1;
   }

    this.element.style[this.side] = this.begin * 100 + "%";
    this.element.style[this.dimension] = ((this.end - this.begin) * 100) + "%";
    this.element.style.opacity = this.opacity;
    if (!this.opacity)
       this.element.style.display = 'none';
    else if (hidden)
       this.element.style.display = 'block';

   return !(this.begin == this.begin1 && this.end == this.end1 && this.opacity == this.opacity1);
}

Glider.prototype.update = function(begin, end, moving) {
    if (begin != this.begin1 || end != this.end1 || (moving ? 1 : 0) != this.opacity1) {
       var w1 = (this.end1 - this.begin1);
       this.begin1 = begin;
       this.end1 = end;
       if (Math.abs(w1 - begin + end) < 0.1) {
           this.begin = this.begin1;
           this.end = this.end1;
       }
       this.opacity1 = (moving ? 1 : 0);
       this.resume();
    }
}  
