function Trap(animator) {
    Anim.call(animator);
    this.down = false,
    this.dx = 0;
    this.dy = 0;
}

Trap.prototype = new Anim();

Trap.prototype.onMouseDown = function(e) {
    this.down = true;
    this.x = this.x0 = e.clientX;
    this.y = this.y0 = e.clientY;
    this.resume();
    return false;
}

Trap.prototype.onMouseUp = function(e) {
    this.down = false;
    this.dx = 0;
    this.dy = 0;
    this.pause();
    return false;
}

Trap.prototype.onMouseOut = function(e) {
    this.down = false;
    return false;
}

Trap.prototype.onMouseMove = function(e) {
    this.x = e.clientX;
    this.y = e.clientY;
    return false;
}

Trap.prototype.bind = function(element) {
   this.element = element;
   var self = this;
   element.onmousedown = function(e) { self.onMouseDown(e); }
   element.onmouseup = function(e) { self.onMouseUp(e);}
   element.onmouseout = function(e) { self.onMouseOut(e); }
   element.onmousemove = function(e) { self.onMouseMove(e); }
   element.onselectstart = function() { return false;}
   element.unselectable = "on";
   element.style.MozUserSelect = "none";
   element.style.cursor = "default";
}

Trap.prototype.iterate = function() {
   this.dx = this.x - this.x0;
   this.dy = this.y - this.y0;
   this.x0 = this.x;
   this.y0 = this.y;
   return this.down ;
}
