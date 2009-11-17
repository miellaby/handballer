function imgCopyGeometry(target, source, zoneWidth, zoneHeight) {
    var imgWidth = parseInt(source.width);
    var imgHeight = parseInt(source.height);
    var ratio = Math.min(1, Math.min(zoneWidth / imgWidth, zoneHeight / imgHeight));
    target.style.width = "" + ratio * imgWidth + "px";
    target.style.height = "" + ratio * imgHeight + "px";
    target.src = source.src;
}

function imgBoxURL(img, url, zoneWidth, zoneHeight, onloadCB) {
    var offscreenImg = new Image();
    var intervalMax = 24;
    var interval = undefined;
    img.src = null;
 
    var clearIntervalIfAny = function() {
        if (interval !== undefined)  {
            clearInterval(interval);
            interval = undefined;
            delete offscreenImg; // I don't trust GC
        }
    };

    var intervalCB = function(issue) {
        if ((--intervalMax) < 0 || offscreenImg.width > 0 || issue) {
            imgCopyGeometry(img, offscreenImg, zoneWidth, zoneHeight);
            img.style.display = "inline";
            if (onloadCB) onloadCB(img);
            clearIntervalIfAny();
        }
    }
    
    // hide image as long as we don't know its geometry
    img.style.display = "none";

    // load image off screen
    offscreenImg.onload = intervalCB;
    offscreenImg.onerror = clearIntervalIfAny;
    offscreenImg.onabort = clearIntervalIfAny;
    interval = setInterval(intervalCB, 330);
    offscreenImg.src = url;
}


