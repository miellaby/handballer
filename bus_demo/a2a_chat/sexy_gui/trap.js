/**
 * a Trap is
 * - bindTarget on every D&Dable element
 * - mousedown or touchstart
 *  => trap
 *   => onMouseDown
 *   =>
 * @param {Animator} animator 
 */
function Trap(animator) {
    Anim.call(animator);
    this.down = false;
    this.dx = this.dy = this.s = 0;
    this.trapped = null;
    this.touchSeq = false;
    this.id = Trap.i++;
}
Trap.i = 0;

Trap.prototype = new Anim();
Trap.prototype.constructor = Trap;

Trap.prototype.trap = function (element, e) {
    console.log("trap", this.id, element.id, e);
    this.trapped = element;
    this.onMouseDown(e);
}

Trap.prototype.onMouseDown = function (e) {
    console.log("onMouseDown", this.id, this.element.id, e);
    this.element.style.display = "block";
    this.down = true;
    this.element.onmousemove = (e) => {
        this.touchSeq === false && this.onMouseMove(e);
    };
    this.element.ontouchmove = (e) => {
        this.touchSeq === true && this.onMouseMove(e);
    };
    if (e.touches) {
        this.x = this.x0 = e.touches[0].clientX;
        this.y = this.y0 = e.touches[0].clientY;
    } else {
        this.x = this.x0 = e.clientX;
        this.y = this.y0 = e.clientY;
    }
    this.s = 0;
    this.resume();
    return false;
}

Trap.prototype.onMouseUp = function (e) {
    console.log("onMouseUp",  this.id, this.element.id, e);
    this.down = false;
    this.element.style.display = "none";

    var s = this.s;
    this.element.onmousemove = null;
    this.element.ontouchmove = null;
    this.dx = this.dy = this.s = 0;
    this.pause();
    if (s < 8 && this.trapped) {
        this.trapped.onclick();
    }
}

Trap.prototype.onMouseOut = function (e) {
    console.log("onMouseUp", this.id, this.element.id, e);
    if (e.target != this.element) return;
    if (this.down) this.onMouseUp();
    return false;
}

Trap.prototype.onMouseMove = function (e) {
    console.log("onMouseMove", this.id, this.element.id, e);
    if (e.touches) {
        this.x = e.touches[0].clientX;
        this.y = e.touches[0].clientY;
    } else {
        this.x = e.clientX;
        this.y = e.clientY;
    }
    return false;
}

Trap.prototype.bind = function (element) {
    console.log("bind", this.id, element);
    this.element = element;
    element.onmousedown = (e) => this.onMouseDown(e);
    element.ontouchstart = (e) => {
        this.touchSeq = true;
        return this.onMouseDown(e);
    };
    element.onmouseup = (e) => this.onMouseUp(e);
    element.ontouchend = (e) => {
        this.touchSeq = false;
        return this.onMouseUp(e);
    };
    element.onmouseout = (e) => this.onMouseOut(e);
    element.ontouchcancel = (e) => {
        this.touchSeq = false;
        return this.onMouseOut(e);
    };
    // onmousemove setted on the fly
    element.onselectstart = () => false;
    element.unselectable = "on";
    element.style.userSelect = "none";
    element.style.cursor = "pointer";
    element.style.display = "none";
}

Trap.prototype.bindTarget = function (element) {
    console.log("bindTarget", this.id, element);
    element.onmousedown = (e) => {
        this.trap(element, e);
        e.preventDefault();
    }
    element.ontouchstart = (e) => {
        this.touchSeq = true;
        this.trap(element, e);
        e.preventDefault();
    };
    element.onselectstart = () => false;
    element.unselectable = "on";
    element.style.MozUserSelect = "none";
    element.style.cursor = "default";
}

Trap.prototype.iterate = function (factor) {
    // if (!factor) return this.down;
    let i = 1;
    this.dx = (this.x - this.x0) * i;
    this.dy = (this.y - this.y0) * i;
    this.s += Math.abs(this.dx) + Math.abs(this.dy);
    this.x0 = this.x;
    this.y0 = this.y;
    return this.down;
}
