function Animator(fps) {
    this.anims = [];
    this.fps = fps || 14;
    this.period = 1000.0 / this.fps;
    this.interval = null;
    this.TraceDiv = null;
    this.TT = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.TTi = 0;
    this.last = 0;
    this.thingsToBeDone = false;
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
   if (this.interval == null) { // start refresh cycle
        var self = this;
        this.interval = setInterval(function() { self.iterate(); }, this.period);
    }
   this.thingsToBeDone = true;
}

Animator.prototype.iterate = function() {
    var i, n = this.anims.length;
    var clonedArray = this.anims.slice();
    var now = Number(new Date());
    var factor = (this.last ? (now - this.last) / this.period : 1.0);
    if (factor > 10) factor = 10;
    this.last = now;
    this.thingsToBeDone = false;
    for (i = 0; i < n; i++) {
        var m = clonedArray[i];
        if (m.state == 1) {
            m.onResume();
            m.state == 2;
        }

        if (!m.iterate(factor)) {
            m.pause();
            var f = m.onFinish;
            m.onFinish = new Function();
            f.call(m);
		 
        } else {
            this.thingsToBeDone = true;
        }
    }

    if (!this.thingsToBeDone) { // stop refresh cycle
        clearInterval(this.interval);
        this.interval = null;
    }

    if (this.logCB) {
        var t0 = this.TT.shift(), t9 = new Date().getTime();
        this.TT.push(t9);
        if ((this.TTi++) % 10 == 0)
            this.logCB(parseInt(10000 / (t9 - t0)));
    }
};

