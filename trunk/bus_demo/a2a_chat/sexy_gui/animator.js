function Animator(freq) {
    this.anims = {};
    this.freq = freq || 8;
    this.interval = null;
    this.profiling = false;
    this.TraceDiv = null;
    this.TT = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.TTi = 0;
}

Animator.prototype.singleton = new Animator();

Animator.prototype.remove = function(anim) {
    delete this.anims[this.id];
}

Animator.prototype.add = function(anim) {
   this.anims[this.id] = anim;
   if (!this.interval) { // start refresh cycle
        var self = this;
        this.interval = setInterval(function() { self.iterate(); }, 1000 / this.freq);
    }
}

Animator.prototype.iterate = function() {
    var thingsToBeDone = false;
    for (mId in this.anims) {
        var m = this.anims[mId];
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

    if (window.profiling) {
        if (!this.TraceDiv)
            this.TraceDiv = document.getElementById("trace");
       
        var t0 = this.TT.shift(), t9 = Date.now();
        this.TT.push(t9);
        if ((this.TTi++) % 10 == 0)
            this.TraceDiv.innerHTML = "" + parseInt(10000 / (t9 - t0));
    }
};

