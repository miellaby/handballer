function RevolutionItem(pos, inFactor, data) {
    this.pos = pos;
    this.inFactor = inFactor;
    this.data = data;
}

RevolutionItem.prototype.onclick = function() {
    if (typeof this.data == "Object" && this.data["onclick"])
        this.data.onclick();
}

function Revolution() {
  Anim.call(this);
}

Revolution.prototype = new Anim();

Revolution.prototype.init = function (disposableCells, itemOffset) {

    //Parameters
    this.items = [];
    this.itemOffset = itemOffset;
    
    // Initial states 
    this.lastItem = null;
    this.pool = { disposables: disposableCells, useds: []};
    this.poolSize = disposableCells.length;
    this.innerAnims = [];
    this.friction=0;
    this.pos = 0;
    this.speed = 0;
    this.n = undefined;
    this.localOffset = 0;

    this.iterate();
};

Revolution.prototype.getItem = function(i) {
    return this.items[i];
};

Revolution.prototype.getMaxPos = function() {
    return (this.lastItem != null ? this.lastItem.pos : 0) + this.itemOffset;
};

Revolution.prototype.splice = function(index, howMany) {
    if (howMany == undefined) howMany = 0;

    var newItems = [];
    var itemAtIndex = this.getItem(index);
    var newItemPos = (itemAtIndex === undefined ? this.getMaxPos() : itemAtIndex.pos); 

    for (var lst = arguments, i = 2, n = lst.length ; i < n; i++) {
        var data = lst[i];
        var lastNewItem = new RevolutionItem(newItemPos, 0, data);
        newItems.push(lastNewItem);
        newItemPos += this.itemOffset;
    }
    
    // var spliceArgs = [index, howMany]; // items removal delayed after the animation
    var spliceArgs = [index + howMany, 0];
    var spliceArgs = spliceArgs.concat(newItems);
    for (var lst = this.innerAnims, i = 0, n = lst.length ; i < n; i++) {
        var elt = lst[i];
        if (elt["onSplice"])
            elt.onSplice.apply(elt, spliceArgs);
    }

    this.items.splice.apply(this.items, spliceArgs);
    
    if (newItems.length) {
        var inMotion = new RevolutionIOAnim(this, index + howMany, newItems.length, true);
        this.innerAnims.push(inMotion);
        inMotion.resume();
    }

    if (howMany) {
        var outMotion = new RevolutionIOAnim(this, index, howMany, false);
        this.innerAnims.push(outMotion);
        outMotion.resume();
    }
                             
    if (index + howMany + newItems.length < this.items.length) {
        var shiftMotion = new RevolutionShiftAnim(this, index + howMany + newItems.length, this.itemOffset * (newItems.length - howMany));
        this.innerAnims.push(shiftMotion);
        shiftMotion.resume();
    };

    this.lastItem = this.items.length ? this.items[this.items.length -1] : null;

    this.resume();
};

Revolution.prototype.doRemove = function(index, howMany) {
    for (var lst = this.innerAnims, i = 0, n = lst.length ; i < n; i++) {
        var elt = lst[i];
        if (elt["onSplice"])
            elt.onSplice(index, howMany);
    }

    this.items.splice(index, howMany);
    this.lastItem = this.items.length ? this.items[this.items.length -1] : null;
}


Revolution.prototype.isMoving = function() {
    return this.innerAnims.length > 0 || this.friction || Math.abs(this.speed) > 0.3 || Math.abs(this.localOffset) > 1;
};

Revolution.prototype.computeSpeed = function() {

    if (this.friction != null) { // external friction
        this.speed = (this.friction + 3 * this.speed) / 4;
        this.speed = Math.max(this.speed, -0.66 * this.itemOffset);
        this.speed = Math.min(this.speed, 0.66 * this.itemOffset);

    } else { // no external friction

        if (Math.abs(this.speed) > this.itemOffset * 0.1)
            this.speed *= 0.9; // slowing down

        else { // notch motion

            this.speed = this.localOffset > 0
                ? Math.min(-this.localOffset * 0.2, -0.2) 
                : Math.max(-this.localOffset * 0.2, 0.2); 
        }
    }
};

Revolution.prototype.iterate = function() {
    var localOffset = this.pos % this.itemOffset;
    localOffset = (localOffset < this.itemOffset / 2 
                   ? localOffset
                   : localOffset -this.itemOffset);
    this.localOffset = localOffset;

    this.computeSpeed();
    
    // apply speed
    var pos = this.pos + this.speed;
    var max = Math.max(this.getMaxPos(), this.poolSize * this.itemOffset);
    this.pos = pos < 0 ? max - (pos % max) : pos % max;
    this.redraw();

    return this.isMoving();
};

Revolution.prototype.redraw = function() {
    var max =  this.getMaxPos();
    var pos = this.pos;
    var localOffset = pos % this.itemOffset;
    var nbItem = this.items.length;
    var padding = Math.max(nbItem, this.poolSize);

    var n = parseInt(pos / this.itemOffset) % padding;
	 
    // free freedable sharables
    if (this.n !== undefined) {
        var d = (n - this.n);
        if (d) {
            if (d > padding / 2)
                d -= padding;
            else if (d < -padding / 2)
                d += padding;
            
            if (d > 0) {
                for (var i = this.n; i < this.n + Math.min(d, this.poolSize); i++) {
                    var cell = this.pool.useds[i % padding];
                    if (cell) {
                        cell.hide()
                        this.pool.useds[i % padding] = null;
                        this.pool.disposables.push(cell);
                    }
                }
            } else if (d < 0) {
                for (var i = this.n + Math.max(0, this.poolSize + d); i < this.n + this.poolSize; i++) {
                    var cell = this.pool.useds[i % padding];
                    if (cell ) {
                        cell.hide();
                        this.pool.useds[i % padding] = null;
                        this.pool.disposables.push(cell);
                    }
                }
            }
        }
    }
    this.n = n;
    for (var i = n, end = n + this.poolSize; i < end; i++) {
        var j = i % padding;
        var cell = this.pool.useds[j];
        if (!cell) {
            cell = this.pool.useds[j] = this.pool.disposables.shift();
        }
        if (j < nbItem) {
            if (cell.item !== this.items[j].data)
                cell.show(this.items[j].data);
        } else if (cell.item != null)
            cell.hide();

        if (j < nbItem) {
            cell.setCoords(this.items[j].inFactor, (max + (this.items[j].pos - pos)) % max - this.itemOffset);
        }
    }
};
