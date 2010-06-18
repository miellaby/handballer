function Trap(animator) {
    Anim.call(animator);
    this.down = false;
    this.dx = this.dy = this.s = 0;
    this.t = null ; // hiding delay timer
}

Trap.prototype = new Anim();

Trap.prototype.trap = function(e) {
    var self = this;
    if (this.t != null) return;
    this.t = setTimeout(function() {
            self.onMouseDown(e);
            self.t = null; }, 200);
}

Trap.prototype.onMouseDown = function(e) {
    this.element.style.display = "block";
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
    this.element.style.display = "none";
    
    var click = Math.abs(this.s) < 4;
    this.down = false;
    this.element.onmousemove = null;
    this.dx = this.dy = this.s = 0;
    this.pause();

    if (this.t != null) {
        clearTimeout(this.t);
        this.t = null;
    }
}

Trap.prototype.onMouseOut = function(e) {
    if (e.target != this.element) return;
    this.onMouseUp();
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
   element.style.cursor = "pointer";
   element.style.display = "none";
}

Trap.prototype.bindTarget = function(element) {
   var self = this;
   element.onmousedown = function(e) { self.trap(e); if (e.preventDefault) e.preventDefault(); else e.returnValue = false; };
   element.onmouseup = function(e) { return self.onMouseUp(e);};
   element.onmouseout = function(e) { return self.onMouseOut(e); }
   element.onselectstart = function() { return false;};
   element.unselectable = "on";
   element.style.MozUserSelect = "none";
   element.style.cursor = "default";
}

Trap.prototype.iterate = function(factor) {
    // if (!factor) return this.down;
   var i = 1;
   this.dx = (this.x - this.x0) * i;
   this.dy = (this.y - this.y0) * i;
   this.s += Math.abs(this.dx) + Math.abs(this.dy);
   this.x0 = this.x;
   this.y0 = this.y;
   return this.down ;
}
