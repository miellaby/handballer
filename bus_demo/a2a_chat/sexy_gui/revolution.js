function RevolutionItem(pos, inFactor) {
    this.revolutionPos = pos;
    this.inFactor = inFactor;
    this.cell = null;
}

function Revolution() {
  Anim.call(this);
}

Revolution.prototype = new Anim();

Revolution.prototype.init = function (areaElement, cellConstructor, nbSeens) {

    //Parameters
    this.areaElement = areaElement;
    this.cellConstructor = cellConstructor;
    this.nbSeens = nbSeens;

    // Initial states 
    this.items = []; // data model = list
    this.leavings = [] ; // transitional list of "leaving" items (i.e. still displayed while already removed from the list)
    this.generation = false; // swapping boolean to detect recyclable cells between 2 successive frames
    this.pool= []; // pool of cells
    this.visibleCells = [];
    this.innerAnims = []; // list of motions within this UI 
    this.friction=null;
    this.pos = 0;
    this.speed = 0;
    this.offset = 0;
    this.n = undefined; // don't use for your own
    this.nbItem = undefined;

    this.iterate();
};

Revolution.prototype.getItem = function(i) {
    return this.items[i];
};

Revolution.prototype.push = function() {
    var args = Array.prototype.slice.call(arguments);
    this.splice.apply(this, [this.items.length, 0].concat(args));
}

Revolution.prototype.unshift = function() {
    var args = Array.prototype.slice.call(arguments);
    this.splice.apply(this, [0, 0].concat(args));
}

Revolution.prototype.splice = function(index, howMany) {
    if (howMany === undefined) howMany = 0;
    var newItems = [];
    var newItemPos = 1.0 + index; // we add 1.0 because it will be displayed outside otherelse (because of the nice clipping)

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
    return this.innerAnims.length > 0 || this.friction != null || Math.abs(this.speed) > 0.006 || Math.abs(this.offset) > 0.005;
};

Revolution.prototype.computeSpeed = function() {
    
    if (this.friction != null) { // external friction
        
        var speed = (this.friction + 1.0 * this.speed) / 2.0;
        speed = Math.max(speed, -0.8);
        this.speed = Math.min(speed, 0.8);
    } else { // no external friction

        if (Math.abs(this.speed) > 0.05)
            this.speed *= 0.9; // slowing down

        else { // notch motion
            var offset = this.pos % 1.0;
            if (offset > 0.5) offset = 1 - offset; 
            if (offset < - 0.5) offset = 1 + offset;
            this.offset = offset;
            this.speed = ( offset % 1.0 ) * -0.04;
        }
    }
};

Revolution.prototype.iterate = function() {
    // compute speed from acceleration/strengths
    this.computeSpeed();
    
    // apply speed
    this.pos += this.speed;

    // redraw
    this.redraw();

    // return anim status
    return this.isMoving();
};

Revolution.prototype.redraw = function() {
    var nbItem = this.items.length;
    var pos    = this.pos;
    var n      = pos > 0 ? parseInt(pos) : parseInt(pos) - 1 ;

    this.generation ^= true;

    if (this.visibleCells.length || nbItem) {
    //    if (this.n != n || this.nbItem != nbItem) {
        this.n = n;
        this.nbItem = nbItem;

        var toGet = [];

        var i, nothing=true,toRight=false;
        for (i = 0; i < nbItem; ++i) {
            var j = (i + n) %nbItem;
            if (j < 0) j += nbItem;
            var offset = this.items[j].revolutionPos - pos;
            var visible = this.cellConstructor.prototype.visible(this.areaElement, offset);
            if (visible > 0) {
                toRight = true ;
                continue;
            }
            if (visible) continue;
            nothing = false;
            cell = this.items[j].cell;
            if (cell != null) {
                cell.generation = this.generation;
            } else
                toGet.push(this.items[j]);
        }

        if (nothing && nbItem) {
            if (toRight) // every cell are far to the right
                this.pos += this.cellConstructor.prototype.getOpeningSize(this.areaElement) + nbItem;
            else // every cell are far to the left
                this.pos -= this.cellConstructor.prototype.getOpeningSize(this.areaElement) + nbItem;
        }

        for (var lst = this.visibleCells, i = 0, cell; cell = lst[i]; ++i) {
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
            var cell = this.pool.shift() || new this.cellConstructor(this.areaElement);
            item.cell = cell;
            cell.show(item);
            this.visibleCells.push(cell);
        }
    }

    for (var lst = this.visibleCells, i = 0, cell; cell = lst[i]; ++i) {
        cell.generation = this.generation;
        cell.setCoords(cell.item.inFactor, cell.item.revolutionPos - pos);
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
                item.cell = this.pool.shift() || new this.cellConstructor(this.areaElement);
                item.cell.show(item);
            }
            item.cell.setCoords(item.inFactor, item.revolutionPos - pos);
        }
    }
};