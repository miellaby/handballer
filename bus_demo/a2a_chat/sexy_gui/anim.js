// Anim very abstract object, mainly defined for its interface

function Anim(animator) {
    this.state = 0; // can be 0, 1, 2: paused, resuming, running
    this.animator = animator || Animator.factory();
    this.start = undefined;
    this.duration = 1000; // second
};

Anim.prototype.isRunning = function () {
    return (this.state != 0);
}

Anim.prototype.pause = function (progress) {
    if (this.isRunning()) {
        this.state = 0;
        this.animator.remove(this);
        this.onPause();
    }
};

Anim.prototype.resume = function (progress) {
    if (!this.isRunning()) {
        this.state = 1;
        this.animator.add(this);
    }
};

Anim.prototype.restart = function (progress) {
    this.start = undefined;
    this.resume();
};

Anim.prototype.iterate = function (progress) { return progress < 1; };
Anim.prototype.onFinish = function() {};
Anim.prototype.onResume = function() {};
Anim.prototype.onPause = function() {};


// -----------------------------------------------------

function readDOM(obj, cornerX, cornerY) {
    var x = parseInt(obj.style[cornerX || "left"]);
    var y = parseInt(obj.style[cornerY || "top"]);
    var w = parseInt(obj.clientWidth);
    var h = parseInt(obj.clientHeight);
    return {
        x: (isNaN(x) ? undefined : x),
        y: (isNaN(y) ? undefined : y),
        w: (isNaN(w) ? undefined : w),
        h: (isNaN(h) ? undefined : h)
    };
};

function writeDOM(obj, coords, cornerX, cornerY, lengthX, lengthY) {
    if (coords.x !== undefined) obj.style[cornerX || "left"] = "" + coords.x + "px";
    if (coords.y !== undefined) obj.style[cornerY || "top"] = "" + coords.y + "px";
    if (coords.w !== undefined) obj.style[lengthX || "width"] = "" + coords.w + "px";
    if (coords.h !== undefined) obj.style[lengthY || "height"] = "" + coords.h + "px";
};

