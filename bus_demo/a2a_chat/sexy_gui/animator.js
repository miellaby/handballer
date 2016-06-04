function Animator() {
    this.anims = new Set([]);
    this.TT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.TTi = 0;
    this.last = 0;
    this.thingsToBeDone = false;
}
Animator.factory = function () {
    Animator.singleton = Animator.singleton || new Animator();
    return Animator.singleton;
}

Animator.prototype.logCB = null;

Animator.prototype.remove = function (anim) {
    this.anims.delete(anim);
}

Animator.prototype.add = function (anim) {
    this.anims.add(anim);
    // start animation
    this.rafId = this.rafId || window.requestAnimationFrame(time => this.iterate(time));
    this.thingsToBeDone = true;
}

Animator.prototype.iterate = function (time) {
    let clonedArray = [... this.anims];
    this.passedTime = (this.last !== 0 ? time - this.last : 0);
    this.last = time;
    this.thingsToBeDone = false;
    clonedArray.forEach(m => {
        if (m.start === undefined) {
            m.start = time;
        }
        m.progress = Math.min(1.0, (time - m.start) / (m.duration || 1.0));
        if (m.state == 1) {
            m.onResume(m.progress, this.passedTime);
            m.state == 2;
        }
        if (!m.iterate(m.progress, this.passedTime)) {
            m.pause(m.progress);
            var f = m.onFinish;
            m.onFinish = function() {};
            f.call(m, m.progress, this.passedTime);
            m.start = undefined;
            m.progress = undefined;
        } else {
            this.thingsToBeDone = true;
        }
    });

    if (!this.thingsToBeDone) { // stop refresh cycle
        window.cancelAnimationFrame(this.rafId);
        this.last = 0;
        this.rafId = null;
    } else {
        this.rafId = window.requestAnimationFrame(time => this.iterate(time));
    }

    if (this.logCB) {
        var t0 = this.TT.shift(), t9 = new Date().getTime();
        this.TT.push(t9);
        if ((this.TTi++) % 10 == 0)
            this.logCB(parseInt(10000 / (t9 - t0)));
    }
};
