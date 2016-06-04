function RevolutionInAnim(revolution, index, howMany) {
    Anim.call(this);
    this.revolution = revolution;
    this.prop = revolution.prop;
    this.where = index;
    this.howMany = howMany;
    this.ratio = 0;
    this.speed = this.c0;
    this.jumpOver = [];
}

RevolutionInAnim.prototype = new Anim();

RevolutionInAnim.prototype.iterate = function(progress, passedTime) {
    var done = false;

    this.ratio += this.speed;

    if (this.ratio > 1) {
        this.ratio = 1;
        done = true;
    }

    this.speed -= this.c1;
    if (this.speed < this.c1) this.speed = this.c1;
    for (var lst = this.revolution.items, i = this.where, n = this.where + this.howMany ; i < n; ++i) {
        var elt = lst[i];
        if (this.jumpOver.indexOf(elt) != -1) continue;
        elt[this.prop].inFactor = this.ratio;
    }
    return !done;
};

RevolutionInAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    var nbNewItem = Math.max(0, arguments.length - 2);
    if (start <= this.where) {
        if (start + howMany <= this.where)
            // splice on the animated set left side 
            this.where += nbNewItem - howMany;
        else {
            // splice trunking the animated set from the left side
            this.howMany -= start + howMany - this.where;
            if (this.howMany < 0) this.howMany=0;
            this.where = start + nbNewItem;
        }
    } else if (start < this.where + this.howMany) {
        if (start + howMany >= this.where + this.howMany) {
            // splice trunking the animated set from the right side
            this.howMany = start - this.where;
        } else {
            // splice within the animated set
            this.howMany += nbNewItem - howMany;
            for (var i = 2, n = arguments.length; i < n; i++) {
                var item = arguments[i];
                this.jumpOver.push(item);
            }
        }
    }
}

RevolutionInAnim.prototype.onFinish = function() {
    // console.log("auto remove");
    this.revolution.innerAnims.delete(this);
};

RevolutionInAnim.prototype.c0 = 0.189;
RevolutionInAnim.prototype.c1 = 0.02;

function RevolutionOutAnim(revolution, start, items) {
    Anim.call(this);
    this.revolution = revolution;
    this.prop = revolution.prop;
    this.where = start;
    this.items = items;
    this.ratio = 1;
    this.speed = 0;
    this.jumpOver = [];
}
RevolutionOutAnim.prototype = new Anim();

RevolutionOutAnim.prototype.iterate = function(progress, passedTime) {
    var done = false;

    this.ratio -= this.speed;
    
    if (this.ratio < 0) {
        this.ratio = 0;
        done = true;
    }

    this.speed += this.c1;

    for (var lst = this.items, i = 0, n = this.items.length ; i < n; ++i) {
        var elt = lst[i];
        if (this.jumpOver.indexOf(elt) != -1) continue;
        elt[this.prop].inFactor = this.ratio;
    }
    return !done;
};

RevolutionOutAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    var nbNewItem = Math.max(0, arguments.length - 2);
    if (start <= this.where) {
        if (start + howMany <= this.where)
            // splice on the animated set left side 
            this.where += nbNewItem - howMany;
        else {
            // splice trunking the animated set from the left side
            this.howMany -= start + howMany - this.where;
            if (this.howMany < 0) this.howMany=0;
            this.where = start + nbNewItem;
        }
    } else if (start < this.where + this.howMany) {
        if (start + howMany >= this.where + this.howMany) {
            // splice trunking the animated set from the right side
            this.howMany = start - this.where;
        } else {
            // splice within the animated set
            this.howMany += nbNewItem - howMany;
            for (var i = 2, n = arguments.length; i < n; i++) {
                var item = arguments[i];
                this.jumpOver.push(item);
            }
        }
    }
}

RevolutionOutAnim.prototype.onFinish = function() {
    // console.log("auto remove");
    this.revolution.innerAnims.delete(this);
};

RevolutionOutAnim.prototype.c1 = 0.02;

function RevolutionShiftAnim(revolution, start, howMany, offset) {
    Anim.call(this);
    this.revolution = revolution;
    this.prop = revolution.prop;
    this.where = start;
    this.howMany = howMany;
    this.offset = offset;
    this.current = 0;
    this.minStep = this.c0 * Math.abs(this.offset);
    this.jumpOver = [];
    //console.log("this.minStep = "+ this.minStep);
} 

RevolutionShiftAnim.prototype = new Anim();

RevolutionShiftAnim.prototype.iterate = function(progress, passedTime) {
    var ratio = 2 * this.current / this.offset - 1;
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
    
    var i = this.where, n = this.howMany, l = this.revolution.items;
    while (n--) {
        var elt=l[i++];
        if (this.jumpOver.indexOf(elt) != -1) continue;
        elt[this.prop].revolutionPos += delta;
    }
    
    this.current += delta;

    return !done;
};

RevolutionShiftAnim.prototype.onSplice = function(start, howMany /*, item, item, ... */) {
    var nbNewItem = Math.max(0, arguments.length - 2);
    if (start <= this.where) {
        if (start + howMany <= this.where)
            // splice on the animated set left side 
            this.where += nbNewItem - howMany;
        else {
            // splice trunking the animated set from the left side
            this.howMany -= start + howMany - this.where;
            if (this.howMany < 0) this.howMany=0;
            this.where = start + nbNewItem;
        }
    } else if (start < this.where + this.howMany) {
        if (start + howMany >= this.where + this.howMany) {
            // splice trunking the animated set from the right side
            this.howMany = start - this.where;
        } else {
            // splice within the animated set
            this.howMany += nbNewItem - howMany;
            for (var i = 2, n = arguments.length; i < n; i++) {
                var item = arguments[i];
                this.jumpOver.push(item);
            }
        }
    }
}

RevolutionShiftAnim.prototype.onFinish = function() {
    this.revolution.innerAnims.delete(this);
}

RevolutionShiftAnim.prototype.c0 = 0.03;
RevolutionShiftAnim.prototype.c1 = 0.3;
