function Animator(freq) {
    this.anims = [];
    this.freq = freq || 10;
    this.interval = null;
    this.TraceDiv = null;
    this.TT = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.TTi = 0;
}

Animator.prototype.singleton = new Animator();
Animator.prototype.logCB = null;

Animator.prototype.remove = function(anim) {
   this.anims.remove(anim);
}

Animator.prototype.add = function(anim) {
   var i = this.anims.indexOf(anim);
   if (i != -1) return;
   this.anims.push(anim);
   if (!this.interval) { // start refresh cycle
        var self = this;
        this.interval = setInterval(function() { self.iterate(); }, 1000 / this.freq);
    }
}

Animator.prototype.iterate = function() {
    var i, n = this.anims.length, thingsToBeDone = false;
    var clonedArray = this.anims.slice();
    for (i = 0; i < n; i++) {
        var m = clonedArray[i];
        if (!m.iterate()) {
            m.pause();
            var f = m.onFinish;
            m.onFinish = new Function();
            f.call(m);
		 
            if (m.state == 1) // anim has been restarted by onFinish
                thingsToBeDone = true;
        } else {
            thingsToBeDone = true;
        }
    }

    if (!thingsToBeDone) { // stop refresh cycle
        clearInterval(this.interval);
        this.interval = null;
    }

    if (this.logCB) {
        var t0 = this.TT.shift(), t9 = Date.now();
        this.TT.push(t9);
        if ((this.TTi++) % 10 == 0)
            this.logCB(parseInt(10000 / (t9 - t0)));
    }
};

