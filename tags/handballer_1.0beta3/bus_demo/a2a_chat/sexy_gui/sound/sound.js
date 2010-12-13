var sound = {
    alias: {},
    embeds: {},
    fakeImgs: {},
    tasks: {},
    play: function(url, duration) {
        if (this.alias[url]) url = this.alias[url];

        var e = this.embeds[url];
        if (!e) {
            e = this.embeds[url] = document.createElement("embed");
            e.setAttribute("src", url);
            e.setAttribute("hidden", true);
            e.setAttribute("autostart", true);
        }

        if (!duration) return;
        if (this.tasks[url]) return; // already playing

        document.body.appendChild(e);
        this.tasks[url] = true;
        var self = this;
        setTimeout(function() { document.body.removeChild(e);  self.tasks[url] = false; }, duration);
    },
    preload: function(url, alias) {
        if (this.fakeImgs[url]) return;
        this.play(url, 0);
        var i = this.fakeImgs[url] = new Image();
        i.src = url;
        i.style.display="none";
        document.body.appendChild(i);
        if (alias) this.alias[alias] = url;
    }
};


