function RevolutionIOAnim(list, start, howMany, in) {
    Anim.call(this);
    this.list = list;
    this.start = start;
    this.howMany = howMany;
    this.in = (in === undefined ? true: in);
    this.step = this.c0
}
RevolutionIOAnim.prototype = new Anim();

RevolutionIOAnim.prototype.iterate = function() {
    this.step = this.step * this.c1;
    var step = this.step;
    if (!this.in) step *= -1;
    var done = true;
    for (var lst = this.list.items, i = this.start, n = this.start + this.howMany ; i < n; i++) {
        var elt = lst[i];
        elt.inFactor += step;
        if (elt.inFactor < 0)
            elt.inFactor = 0;
        else if (elt.inFactor > 1)
            elt.inFactor = 1;
        else
            done = false;
    }
    return done;
};

RevolutionIOAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    if (this.start >= start) this.start += Math.min(0, arguments.length - 2) - howMany;
}

RevolutionIOAnim.prototype.onFinish = function() {
    this.list.innerAnims.remove(this);
    if (!this.in && this["start"] !== undefined) 
        this.list.doRemove(this.start, this.howMany);
};

RevolutionIOAnim.prototype.c0 = 2;
RevolutionIOAnim.prototype.c1 = 1.5;

function RevolutionShiftAnim(list, start, offset) {
    Anim.call(this);
    this.list = list;
    this.start = start;
    this.offset = offset;
    this.current = 0;
    this.minStep = this.c0 * Math.abs(this.offset);
} 

RevolutionShiftAnim.prototype = new Anim();

RevolutionShiftAnim.prototype.iterate = function() {
    var ratio = this.current / this.offset - 0.5;
    var step = this.c1 * (ratio*ratio) ;
    if (step < this.minStep)
        step = this.minStep;
    var delta = this.offset < 0 ? -step : step;

    var done = false;
    if (delta < 0 && this.current + delta < this.offset
        || delta > 0 && this.current + delta > this.offset) {
        delta = (delta > 0 ? this.offset - this.current : this.current - this.offset);
        done = true;
    }
    
    var i = this.start, n = this.list.items.length;
    while (i < n) {
        this.list[i].pos += delta;
        i++;
    }
    
    this.current += delta;

    return done;
};

RevolutionShiftAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    if (this.start >= start) this.start += Math.min(0, arguments.length - 2) - howMany;
}

RevolutionShiftAnim.prototype.onFinish = function() {
    this.list.innerAnims.remove(this);
}

RevolutionShiftAnim.prototype.c0 = 0.05;
RevolutionShiftAnim.prototype.c1 = 10;
