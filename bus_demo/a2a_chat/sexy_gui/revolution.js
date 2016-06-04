function Revolution() {
    Anim.call(this);
}

Revolution.prototype = new Anim();
Revolution.prototype.constructor = Revolution;
Revolution.prototype.instanceCounter = 0;
Revolution.prototype.init = function (cellConstructor, glider) {
    // each instance gets an unique id
    this.instanceId = Revolution.prototype.instanceCounter++;
    this.prop = "revol" + this.instanceId;

    //Parameters
    this.cellConstructor = cellConstructor;
    this.glider = glider;

    // Initial states 
    this.items = []; // data model = list
    this.leavings = []; // transitional list of "leaving" items (i.e. still displayed while already removed from the list)
    this.generation = false; // swapping boolean to detect recyclable cells between 2 successive frames
    this.pool = []; // pool of cells
    this.visibleCells = [];
    this.innerAnims = new Set([]); // list of motions within this UI 
    this.friction = null;
    this.pos = 0;
    this.speed = 0;
    this.offset = 0;
    this.n = undefined; // don't use for your own
    this.nbItem = undefined;
    this.motion = false;
    this.iterate(0, 0);
};

Revolution.prototype.getItem = function (i) {
    return this.items[i];
};

Revolution.prototype.push = function () {
    var args = Array.prototype.slice.call(arguments);
    this.splice.apply(this, [this.items.length, 0].concat(args));
}

Revolution.prototype.unshift = function () {
    var args = Array.prototype.slice.call(arguments);
    this.splice.apply(this, [0, 0].concat(args));
}

Revolution.prototype.splice = function (index, howMany) {
    if (howMany === undefined) howMany = 0;
    var newItems = [];
    var newItemPos = 1.0 + index; // we add 1.0 because it will be displayed outside otherelse (because of the nice clipping)

    for (var l = arguments, i = 2 /* jump over 2 first args */, n = l.length; i < n; ++i) {
        var newItem = l[i];
        newItem[this.prop] = {
            revolutionPos: newItemPos,
            inFactor: 0,
            cell: null
        };
        newItems.push(newItem);
        newItemPos += 1.0;
    }

    var spliceArgs = [index, howMany];
    if (newItems.length) {
        spliceArgs.push.apply(spliceArgs, newItems);
        this.innerAnims.forEach(a => a["onSplice"] && a.onSplice.apply(a, spliceArgs));
    }

    var outs = this.items.splice.apply(this.items, spliceArgs);

    if (newItems.length) {
        var inAnim = new RevolutionInAnim(this, index, newItems.length);
        this.innerAnims.add(inAnim);
        inAnim.resume();
    }

    if (outs.length) {
        //console.log("outs " + outs.length);
        this.leavings.push.apply(this.leavings, outs);

        var outAnim = new RevolutionOutAnim(this, index, outs);
        this.innerAnims.add(outAnim);
        outAnim.resume();
    }

    if (newItems.length != howMany && index + newItems.length < this.items.length) {
        var shiftAnim = new RevolutionShiftAnim(this,
                                                /* start */ index + newItems.length,
                                                /* howMany */ this.items.length - index - newItems.length,
                                                /* offset */ newItems.length - howMany);
        this.innerAnims.add(shiftAnim);
        shiftAnim.resume();
    };

    this.resume();
};


Revolution.prototype.isMoving = function () {
    return this.innerAnims.size > 0 || this.motion;
};

Revolution.prototype.computeSpeed = function (progress, time) {
    this.motion = false;
    if (this.friction != null) { // external friction
        if (Math.abs(this.friction - this.speed) < 0.4) {
            this.speed = this.friction;
        } else {
            this.speed += this.friction > this.speed ? 0.4 : -0.4;
        }
        this.motion = true;
    } else if (!this.donuts && this.pos < -0.5) {
        if (this.speed < 0.2) {
            this.speed -= this.pos * 0.02;
            if (this.speed > 0.2) this.speed = 0.2;
        }
        this.motion = true;
    } else if (!this.donuts && this.nbItem && this.pos > this.nbItem - 0.5) {
        if (this.speed > -0.2) {
            this.speed -= (this.pos - this.nbItem) * 0.02;
            if (this.speed < -0.2) this.speed = -0.2;
        }
        this.motion = true;
    } else {
        var a = Math.abs(this.speed);
        if (a > 0.2) {
            this.speed *= 0.8; // slowing quick
            this.motion = true;
        } else { // notch motion
            var offset = this.pos % 1.0;
            if (offset > 0.5) offset = 1 - offset;
            if (offset < - 0.5) offset = 1 + offset;
            var speed = this.speed - offset * 0.2;
            if (offset * (speed + offset) <= 0) {
                this.offset = 0;
                this.speed = 0;
            } else {
                this.offset = offset;
                this.speed = Math.min(Math.max(speed * 0.95, -0.05), 0.05);
                this.motion = true;
            }

        }
    }
};


Revolution.prototype.computeItemSide = function (item) {
    var x = item[this.prop].revolutionPos - this.pos - 1.0;
    return (x > this.cellConstructor.prototype.getOpeningSize() ? 1
        : (x < - 1.0 ? - 1 : 0));
}

Revolution.prototype.iterate = function (progress, passedTime) {
    // compute speed from acceleration/strengths
    this.computeSpeed(progress, passedTime);

    // apply speed
    this.pos += this.speed * (0.1 * passedTime);

    // redraw
    this.redraw();

    // return anim status
    return this.isMoving();
};

Revolution.prototype.redraw = function () {
    var nbItem = this.items.length;
    var pos = this.pos;
    var n = pos > 0 ? parseInt(pos) : parseInt(pos) - 1;
    var o = this.cellConstructor.prototype.getOpeningSize() || 1;

    this.generation ^= true;

    if (this.visibleCells.length || nbItem) {
        //    if (this.n != n || this.nbItem != nbItem) {
        this.n = n;
        this.nbItem = nbItem;

        var toGet = [];

        var i, nothing = true, toRight = false;
        for (i = 0; i < nbItem; ++i) {
            var j = (i + n) % nbItem;
            if (j < 0) j += nbItem;
            var side = this.computeItemSide(this.items[j]);
            if (side > 0) {
                toRight = true;
                continue;
            }
            if (side) continue;
            nothing = false;
            cell = this.items[j][this.prop].cell;
            if (cell != null) {
                cell.generation = this.generation;
            } else
                toGet.push(this.items[j]);
        }

        if (this.donuts) {
            if (nothing && nbItem) {
                if (toRight) // every cell are far to the right
                    this.pos += o + nbItem;

                else // every cell are far to the left
                    this.pos -= o + nbItem;
            }
        }

        for (var lst = this.visibleCells, i = 0, cell; cell = lst[i]; ++i) {
            if (cell.generation == this.generation) continue;
            // not visible any more
            cell.item[this.prop].cell = null;
            this.pool.push(cell);
            cell.hide();
            lst.splice(i--, 1);
            m--;
        }

        while (toGet.length) {
            var item = toGet.shift();
            var cell = this.pool.shift() || new this.cellConstructor();
            item[this.prop].cell = cell;
            cell.show(item);
            this.visibleCells.push(cell);
        }
    }

    for (var lst = this.visibleCells, i = 0, cell; cell = lst[i]; ++i) {
        cell.generation = this.generation;
        cell.setCoords(cell.item[this.prop].inFactor, cell.item[this.prop].revolutionPos - pos);
    }

    for (var lst = this.leavings, i = 0, m = lst.length; i < m; i++) {
        var item = lst[i];
        var itemCtx = item[this.prop];
        if (itemCtx.inFactor <= 0) {
            if (itemCtx.cell) {
                this.pool.push(itemCtx.cell);
                itemCtx.cell.hide();
                itemCtx.cell = null;
            }
            lst.splice(i--, 1);
            m--;
        } else {
            if (!itemCtx.cell) {
                itemCtx.cell = this.pool.shift() || new this.cellConstructor();
                itemCtx.cell.show(item);
            }
            itemCtx.cell.setCoords(itemCtx.inFactor, itemCtx.revolutionPos - pos);
        }
    }
    if (this.glider) this.glider.update((pos + o) / (Math.max(o, nbItem) + 2 * o), (pos + 2 * o) / (Math.max(o, nbItem) + 2 * o), this.isMoving());
};
