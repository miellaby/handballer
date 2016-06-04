function imgCopyGeometry(target, source, zoneWidth, zoneHeight) {
    var imgWidth = parseInt(source.width);
    var imgHeight = parseInt(source.height);
    if (imgWidth || imgHeight) {
        var ratio = Math.min(1, Math.min(zoneWidth / imgWidth, zoneHeight / imgHeight));
        target.style.width = "" + ratio * imgWidth + "px";
        target.style.height = "" + ratio * imgHeight + "px";
    }
    target.src = source.src;
}

function imgBoxURL(img, url, zoneWidth, zoneHeight, onloadCB) {

    // hide image as long as we don't know its geometry
    img.style.display = "none";
    img.src = ''; // unload existing image if any
    if (!url) return; // no target url, stop here. 

    var offscreenImg = new Image();
    var intervalMax = 24;
    var interval = undefined;

    var clearIntervalIfAny = function () {
        if (interval !== undefined) {
            clearInterval(interval);
            interval = undefined;
            document.body.removeChild(offscreenImg);
            delete offscreenImg; // I don't trust GC
        }
    };

    var intervalCB = function (issue) {
        if ((--intervalMax) < 0 || offscreenImg.width > 0 || issue) {
            try {
                imgCopyGeometry(img, offscreenImg, zoneWidth, zoneHeight);
            } catch (err) { console.log(err); }
            img.style.display = "inline";
            clearIntervalIfAny();
            if (onloadCB) onloadCB(img);
        }
    };

    // load image off screen
    offscreenImg.style.display = 'none';
    offscreenImg.onload = intervalCB;
    offscreenImg.onerror = clearIntervalIfAny;
    offscreenImg.onabort = clearIntervalIfAny;
    interval = setInterval(intervalCB, 330);
    offscreenImg.src = url || '';
    document.body.appendChild(offscreenImg);
}


