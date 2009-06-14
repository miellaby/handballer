function Trap(animator) {
    Anim.call(animator);
    this.down = false;
    this.dx = this.dy = this.s = 0;
    this.t = null ; // hiding delay timer
}

Trap.prototype = new Anim();

Trap.prototype.untrap = function(delay) {
    var self = this;
    self.element.style.display = "none";
    if (this.t) cancelTimeout(this.t);
    this.t = setTimeout(function() { self.element.style.display = "block"; self.t = null; }, delay);
}

Trap.prototype.onMouseDown = function(e) {
    var self = this;
    this.down = true;
    this.element.onmousemove = function(e) { return self.onMouseMove(e); }
    this.x = this.x0 = e.clientX;
    this.y = this.y0 = e.clientY;
    this.s = 0;
    this.resume();
    return false;
}

Trap.prototype.onMouseUp = function(e) {
    var click = Math.abs(this.s) < 4;
    this.down = false;
    this.element.onmousemove = null;
    this.dx = this.dy = this.s = 0;
    this.pause();
    if (click)
        this.untrap(200);
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
   element.onmousedown = function(e) { return self.onMouseDown(e); }
   element.onmouseup = function(e) { return self.onMouseUp(e);}
   element.onmouseout = function(e) { return self.onMouseOut(e); }
   // onmousemove setted on the fly
   element.onselectstart = function() { return false;}
   element.unselectable = "on";
   element.style.MozUserSelect = "none";
   element.style.cursor = "default";
}

Trap.prototype.iterate = function() {
   this.dx = this.x - this.x0;
   this.dy = this.y - this.y0;
   this.s += Math.abs(this.dx) + Math.abs(this.dy);
   this.x0 = this.x;
   this.y0 = this.y;
   return this.down ;
}
