function RevolutionItem(pos, inFactor, data) {
    this.pos = pos;
    this.inFactor = inFactor;
    this.data = data;
}

RevolutionItem.prototype.onclick() {
    if (typeof this.data == "Object" && this.data["onclick"])
        this.data.onclick();
}

function Revolution(id, obj) {
  Anim.call(this, id, obj);
}

Revolution.prototype = new Anim();

Revolution.prototype.init = function (disposables, itemOffset) {

    //Parameters
    this.items = [];
    this.lastItem = null;
    this.itemOffset = itemOffset;
    
    // Initial states 
    this.pool = { disposables: disposables, useds: []};
    this.poolSize = disposables.length;
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
    return (!this.lastItem ? this.lastItem.pos : 0) + this.offset;
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
        newItemPos += this.offset;
    }
    
    // var spliceArgs = [index, howMany]; // items removal delayed after the animation
    var spliceArgs = [index + howMany, 0];
    spliceArgs.concat.call(spliceArgs, newItems);

    for (var lst = this.innerAnims, i = 0, n = lst.length ; i < n; i++) {
        var elt = lst[i];
        if (elt["onSplice"])
            elt.onSplice.call(elt, spliceArgs);
    }

    this.items.splice.call(this.items, spliceArgs);
    
    if (newItems.length)
        this.innerAnims.push(new RevolutionIOAnim(this, newItems));

    if (howMany) {
        this.innerAnims.push(new RevolutionIOAnim(this, index, howMany, false));
    }
                             
    if (index + howMany + newItems.length < this.items.length)
        this.innerAnims.push(new RevolutionShiftAnim(this, index + howMany + newItems.length, this.offset * (newItems.length - howMany)));

    this.lastItem = this.items.length ? this.items[this.items.length -1] : null;
};

Revolution.prototype.doRemove = function(index, howMany) {
    for (var lst = this.innerAnims, i = 0, n = lst.length ; i < n; i++) {
        var elt = lst[i];
        if (elt["onSplice"])
            elt.onSplice(index, howMany);
    }

    this.items.splice(index, howMany);
}


Revolution.prototype.isMoving = function() {
    return (this.innerAnims.length > 0);
};

Revolution.prototype.computeSpeed = function() {
    if (this.friction != null) { // external friction
    
    if (this.speed <= 0)
      if (this.friction < this.speed)
        this.speed = Math.max(this.friction, -0.66 * this.itemOffset);
      else
        this.speed = (this.friction + this.speed) / 2;

    if (this.speed >= 0)
      if (this.friction > this.speed)
        this.speed = Math.min(this.friction, 0.66 * this.itemOffset);
      else
        this.speed = (this.friction + this.speed) / 2;

  } else { // no external friction

      if (Math.abs(this.speed) > 5)
          this.speed *= 0.8; // slowing down

      else { // notch motion

          var localOffset = this.pos % this.itemOffset;
          localOffset = (localOffset < this.itemOffset / 2 
                         ? -localOffset
                         : this.itemOffset - localOffset);
          this.speed = localOffset < 0
              ? Math.min(localOffset * 0.33, -2) 
              : Math.max(localOffset * 0.33, 2); 
      }
  }
};

Revolution.prototype.iterate = function() {
    this.computeSpeed();
    
    // apply speed
    var pos = this.pos + this.speed;
    var max = this.getMaxPos();
    this.pos = (pos < 0 ? max + (pos % max) : pos);
    this.redraw();
};

Revolution.prototype.redraw = function() {
    var pos = this.pos;
    var localOffset = pos % this.itemOffset;
    var nbItem = this.items.length;
    var n = parseInt(pos / this.itemOffset) % nbItem;
	 
    // free freedable sharables
    if (this.n !== undefined) {
        var d = (n - this.n);
        if (d) {
            if (d > nbItem / 2)
                d = d - nbItem;
            else if (d < -nbItem / 2)
                d = nbItem + d;
            
            if (d > 0) {
                for (var i = this.n; i < this.n + Math.min(d, this.poolSize); i++) {
                    var cell = this.pool.useds[i % nbItem];
                    if (cell) {
                        cell.hide()
                        this.pool.useds[i % nbItem] = null;
                        this.pool.disposables.push(cell);
                    }
                }
            } else if (d < 0) {
                for (var i = this.n + Math.max(0, this.poolSize + d); i < this.n + this.poolSize; i++) {
                    var cell = this.pool.useds[i % nbItem];
                    if (cell) {
                        cell.hide();
                        this.pool.useds[i % nbItem] = null;
                        this.pool.disposables.push(cell);
                    }
                }
            }
        }
    }
    this.n = n;

    for (var i = n, end = n + this.poolSize; i < end; i++) {
        var j = i % nbItem;
        var cell = this.pool.useds[j];
        if (!cell) {
            cell = this.pool.useds[j] = this.pool.disposables.shift();
            cell.show(this.items[j]);
        }
        cell.setX(cell.item.pos % pos);
    }
    
    return this.innerAnims.length > 0 || Math.abs(this.friction) > 1 || Math.abs(this.speed) > 1 || Math.abs(this.localOffset) > 1;
};
