function RevolutionIOAnim(revolution, start, howMany, inout) {
    Anim.call(this);
    this.revolution = revolution;
    this.start = start;
    this.howMany = howMany;
    this.inout = (inout === undefined ? true: inout);
    this.ratio = this.inout ? 0 : 1;
    this.speed = this.inout ? this.c0 : 0;
}
RevolutionIOAnim.prototype = new Anim();

RevolutionIOAnim.prototype.iterate = function() {
    var done = true;
    this.ratio += this.speed;
    if (this.ratio < 0)
        this.ratio = 0;
    else if (this.ratio > 1)
        this.ratio = 1;
    else
        done = false;

    this.speed -= this.c1;
    if (this.inout && this.speed < this.c1) this.speed = this.c1;
    for (var lst = this.revolution.items, i = this.start, n = this.start + this.howMany ; i < n; i++) {
        var elt = lst[i];
        elt.inFactor = this.ratio;
    }
    return !done;
};

RevolutionIOAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    if (this.start >= start) this.start += Math.max(0, arguments.length - 2) - howMany;
}

RevolutionIOAnim.prototype.onFinish = function() {
    this.revolution.innerAnims.remove(this);
    if (!this.inout && this["start"] !== undefined) 
        this.revolution.doRemove(this.start, this.howMany);
};

RevolutionIOAnim.prototype.c0 = 0.189;
RevolutionIOAnim.prototype.c1 = 0.02;

function RevolutionShiftAnim(revolution, start, offset) {
    Anim.call(this);
    this.revolution = revolution;
    this.start = start;
    this.offset = offset;
    this.current = start;
    this.minStep = this.c0 * Math.abs(this.offset);
} 

RevolutionShiftAnim.prototype = new Anim();

RevolutionShiftAnim.prototype.iterate = function() {
    var ratio = 2 * (this.current - this.start) / (this.offset - this.start) - 1;
    var step = this.c1 * (1 - ratio*ratio) ;
    if (step < this.minStep)
        step = this.minStep;
    var delta = this.offset < 0 ? -step : step;

    var done = false;
    if (delta < 0 && this.current + delta < this.offset
        || delta > 0 && this.current + delta > this.offset) {
        delta = (delta > 0 ? this.offset - this.current : this.current - this.offset);
        done = true;
    }
    
    var i = this.start, n = this.revolution.items.length;
    while (i < n) {
        this.revolution.items[i].pos += delta;
        i++;
    }
    
    this.current += delta;

    return !done;
};

RevolutionShiftAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    if (this.start >= start) this.start += Math.max(0, arguments.length - 2) - howMany;
}

RevolutionShiftAnim.prototype.onFinish = function() {
    this.revolution.innerAnims.remove(this);
}

RevolutionShiftAnim.prototype.c0 = 0.03;
RevolutionShiftAnim.prototype.c1 = 20;
