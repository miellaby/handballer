// Anim very abstract object, mainly defined for its interface

function Anim(animator) {
    this.state = 0;
    this.animator = animator || Animator.prototype.singleton;
};

Anim.prototype.isRunning = function() {
    return (this.state != 0);
}

Anim.prototype.pause = function () {
    if (this.isRunning()) {
        this.state = 0;
        this.animator.remove(this);
        this.onPause();
    }
};

Anim.prototype.resume = function() {
    if (!this.isRunning()) {
        this.state = 1;
        this.animator.add(this);
        this.onResume();
    } 
};

Anim.prototype.iterate = function () { return true; };
Anim.prototype.onFinish = new Function();
Anim.prototype.onResume = new Function();
Anim.prototype.onPause = new Function();


// -----------------------------------------------------

function readDOM(obj, cornerX, cornerY) {
    var x = parseInt(obj.style[cornerX || "left"]);
    var y = parseInt(obj.style[cornerY || "top"]);
    var w = parseInt(obj.style.width);
    var h = parseInt(obj.style.heigh);
    return {
        x: (x == NaN ? undefined : x),
        y: (y == NaN ? undefined : y),
        w: (w == NaN ? undefined : w),
        h: (h == NaN ? undefined : h)
    };
};

function writeDOM(coords, obj, cornerX, cornerY) {
    if (coords.x !== undefined) obj.style[cornerX || "left"] = "" + coords.x + "px";
    if (coords.y !== undefined) obj.style[cornerY || "top"] = "" + coords.y + "px";
    if (coords.w !== undefined) obj.style.width = "" + coords.w + "px";
    if (coords.h !== undefined) obj.style.height = "" + coords.h  + "px";
};

