function RevolutionItem(pos, inFactor) {
    this.revolutionPos = pos;
    this.inFactor = inFactor;
    this.cell = null;
}


function Revolution() {
  Anim.call(this);
}

Revolution.prototype = new Anim();

Revolution.prototype.init = function (cellPool) {

    //Parameters
    this.items = []; // data model = list
    this.leavings = [] ; // transitional list of "leaving" (i.e. displayed as being removed) items
    // Initial states 
    this.generation = false; // swapping boolean to detect recyclable cells between 2 successive frames
    this.pool= cellPool; // pool of cells
    this.poolSize = cellPool.length;
    this.visibleCells = [];
    this.innerAnims = []; // list of motions within this UI 
    this.friction=0;
    this.pos = 0;
    this.speed = 0;
    this.n = undefined;
    this.nbItem = undefined;
    this.localOffset = 0;

    this.iterate();
};

Revolution.prototype.getItem = function(i) {
    return this.items[i];
};

Revolution.prototype.splice = function(index, howMany) {
    if (howMany === undefined) howMany = 0;
    var newItems = [];
    var newItemPos = index; 

    for (var l = arguments, i = 2 /* jump over 2 first args */, n = l.length; i < n; ++i) {
        var newItem = l[i];
        RevolutionItem.call(newItem, newItemPos, 0);
        newItems.push(newItem);
        newItemPos += 1.0;
    }
    
    var spliceArgs = [index, howMany];
    if (newItems.length)
        spliceArgs.push.apply(spliceArgs, newItems);

    for (var l = this.innerAnims, i = 0, n = l.length; i < n; ++i) {
        var anim = l[i];
        if (anim["onSplice"])
            anim.onSplice.apply(anim, spliceArgs);
    }

    var outs = this.items.splice.apply(this.items, spliceArgs);

    if (newItems.length) {
        var inAnim = new RevolutionInAnim(this, index, newItems.length);
        this.innerAnims.push(inAnim);
        inAnim.resume();
    }

    if (outs.length) {
        //console.log("outs " + outs.length);
        this.leavings.push.apply(this.leavings, outs);

        var outAnim = new RevolutionOutAnim(this, index, outs);
        this.innerAnims.push(outAnim);
        outAnim.resume();
    }
                             
    if (newItems.length != howMany && index + newItems.length < this.items.length) {
        var shiftAnim = new RevolutionShiftAnim(this,
                                                /* start */ index + newItems.length,
                                                /* howMany */ this.items.length - index - newItems.length,
                                                /* offset */ newItems.length - howMany);
        this.innerAnims.push(shiftAnim);
        shiftAnim.resume();
    };

    this.resume();
};


Revolution.prototype.isMoving = function() {
    return this.innerAnims.length > 0 || this.friction || Math.abs(this.speed) > 0.006 || Math.abs(this.localOffset) > 0.005;
};

Revolution.prototype.computeSpeed = function() {

    if (this.friction != null) { // external friction
        this.speed = (this.friction + 6.0 * this.speed) / 7.0;
        this.speed = Math.max(this.speed, -0.2);
        this.speed = Math.min(this.speed, 0.2);

    } else { // no external friction

        if (Math.abs(this.speed) > 0.05)
            this.speed *= 0.9; // slowing down

        else { // notch motion

            this.speed = ( this.pos % 1.0 ) * -0.04;
        }
    }
};

Revolution.prototype.iterate = function() {
    var localOffset = this.pos % 1.0;
    localOffset = (localOffset < 0.5 
                   ? localOffset
                   : localOffset - 1.0);
    this.localOffset = localOffset;

    this.computeSpeed();
    
    // apply speed
    var pos = this.pos + this.speed;
    var max = Math.max(this.items.length + 1, this.poolSize);
    this.pos = pos < 0 ? max - (pos % max) : pos % max;
    this.redraw();

    return this.isMoving();
};

Revolution.prototype.redraw = function() {
    var nbItem = this.items.length;
    var max = 1.0 * Math.max(nbItem + 1, this.poolSize);
    var padding = Math.max(nbItem, this.poolSize);
    var pos = this.pos;
    var localOffset = pos % 1.0;

    var n = parseInt(pos) % padding;
    this.generation ^= true;


    //    if (this.n != n || this.nbItem != nbItem) {
        this.n = n;
        this.nbItem = nbItem;

        var toGet = [];


        for (var i = 0, m = this.poolSize-1; i < m; ++i) {
            var j = (i + n) % padding;
            if (j >= nbItem) continue;
            var cell = this.items[j].cell;
            if (cell != null) {
                cell.generation = this.generation;
            } else
                toGet.push(this.items[j]);
        }

        for (var lst = this.visibleCells, i = 0, m = lst.length; i < m; ++i) {
            var cell = lst[i];
            if (cell.generation == this.generation) continue;
            // not visible any more
            cell.item.cell = null;
            this.pool.push(cell);
            cell.hide();
            lst.splice(i--,1);
            m--;
        }

        while (toGet.length) {
            var item = toGet.shift();
            var cell = this.pool.shift();
            item.cell = cell;
            cell.show(item);
            this.visibleCells.push(cell);
        }
    //}

    for (var lst = this.visibleCells, i = 0, m = lst.length; i < m; ++i) {
        var cell = lst[i];
        cell.generation = this.generation;
        cell.setCoords(cell.item.inFactor, (max + (cell.item.revolutionPos - pos)) % max);
    }

    for (var lst = this.leavings, i = 0, m = lst.length; i < m; i++) {
        var item = lst[i];
        if (item.inFactor <= 0) {
            if (item.cell) {
                this.pool.push(item.cell);
                item.cell.hide();
                item.cell = null;
            }
            lst.splice(i--,1);
            m--;
        } else {
            if (!item.cell) {
                item.cell = this.pool.shift();
                item.cell.show(item);
            }
            item.cell.setCoords(item.inFactor, (max + (item.revolutionPos - pos)) % max);
        }
    }
};
