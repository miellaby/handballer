/**
 * A class to parse color values in different formats and convert to others. 
 * @author Stoyan Stefanov <sstoo@gmail.com>, modified by Piyush Soni <piyush_soni@yahoo.com>
 * @OriginalScriptLink   http://www.phpied.com/rgb-color-parser-in-javascript/
 * @ModifiedScriptLink   http://www.piyushsoni.com/scripts/RGBColor.js
 * @license Use it if you like it
 */ /* HandBaller A2AC fork 2010/06/29 */

function RGBColor(color)
{
    if (color && color.constructor == RGBColor) {
        this.name = color.name;
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        return this;
    }

    // prepare string
    color = color ? color.replace(/ /g,'').replace(/^#/,'').toLowerCase() : "";

    // try translating color name
    if (this.namedColors[color]) {
        this.name = color;
        color = this.namedColors[color]; // hexa
    } else {
        this.name = null;
        // try channels format
        var bits = this.re.exec(color);
        if (bits) {
            this.r = parseInt(bits[1]) & 0xFF;
            this.g = parseInt(bits[2]) & 0xFF;
            this.b = parseInt(bits[3]) & 0xFF;
            return this;
        }
    }
    // hexa format
    var v = parseInt(color, 16);
    this.r = color.length == 6 ? (v >> 16) & 0xFF :
        ((v >> 8) & 0xF) * 81;
    this.g = color.length == 6 ? (v >> 8) & 0xFF :
        ((v >> 4) & 0xF) * 81;
    this.b = color.length == 6 ? v & 0xFF :
        (v & 0xF) * 81; 
}

RGBColor.prototype = {
    constructor: RGBColor,
    namedColors: {
        aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '00ffff', aquamarine: '7fffd4', azure: 'f0ffff', beige: 'f5f5dc', bisque: 'ffe4c4', black: '000000', blanchedalmond: 'ffebcd', blue: '0000ff', blueviolet: '8a2be2', brown: 'a52a2a', burlywood: 'deb887', cadetblue: '5f9ea0', chartreuse: '7fff00', chocolate: 'd2691e', coral: 'ff7f50', cornflowerblue: '6495ed', cornsilk: 'fff8dc', crimson: 'dc143c',
        cyan: '00ffff', darkblue: '00008b', darkcyan: '008b8b', darkgoldenrod: 'b8860b', darkgray: 'a9a9a9', darkgreen: '006400', darkgrey: 'a9a9a9', darkkhaki: 'bdb76b', darkmagenta: '8b008b', darkolivegreen: '556b2f', darkorange: 'ff8c00', darkorchid: '9932cc', darkred: '8b0000', darksalmon: 'e9967a', darkseagreen: '8fbc8f', darkslateblue: '483d8b', darkslategray: '2f4f4f', darkslategrey: '2f4f4f', darkturquoise: '00ced1', darkviolet: '9400d3', deeppink: 'ff1493', deepskyblue: '00bfff', dimgray: '696969', dimgrey: '696969', dodgerblue: '1e90ff',
        feldspar: 'd19275', firebrick: 'b22222', floralwhite: 'fffaf0', forestgreen: '228b22', fuchsia: 'ff00ff', gainsboro: 'dcdcdc', ghostwhite: 'f8f8ff', gold: 'ffd700', goldenrod: 'daa520', gray: '808080', grey: '808080', green: '008000', greenyellow: 'adff2f', honeydew: 'f0fff0', hotpink: 'ff69b4',
        indianred: 'cd5c5c', indigo: '4b0082', ivory: 'fffff0', khaki: 'f0e68c', lavender: 'e6e6fa', lavenderblush: 'fff0f5', lawngreen: '7cfc00', lemonchiffon: 'fffacd', lightblue: 'add8e6', lightcoral: 'f08080', lightcyan: 'e0ffff', lightgoldenrodyellow: 'fafad2', lightgray: 'd3d3d3', lightgreen: '90ee90', lightgrey: 'd3d3d3', lightpink: 'ffb6c1', lightsalmon: 'ffa07a', lightseagreen: '20b2aa', lightskyblue: '87cefa', lightslategray: '778899', lightslategrey: '778899', lightslateblue: '8470ff', lightsteelblue: 'b0c4de', lightyellow: 'ffffe0',
        lime: '00ff00', limegreen: '32cd32', linen: 'faf0e6', magenta: 'ff00ff', maroon: '800000', mediumaquamarine: '66cdaa', mediumblue: '0000cd', mediumorchid: 'ba55d3', mediumpurple: '9370d8', mediumseagreen: '3cb371', mediumslateblue: '7b68ee', mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc', mediumvioletred: 'c71585', midnightblue: '191970', mintcream: 'f5fffa', mistyrose: 'ffe4e1', moccasin: 'ffe4b5',
        navajowhite: 'ffdead', navy: '000080', oldlace: 'fdf5e6', olive: '808000', olivedrab: '6b8e23', orange: 'ffa500', orangered: 'ff4500', orchid: 'da70d6',
	palegoldenrod: 'eee8aa', palegreen: '98fb98', paleturquoise: 'afeeee', palevioletred: 'd87093', papayawhip: 'ffefd5', peachpuff: 'ffdab9', peru: 'cd853f', pink: 'ffc0cb', plum: 'dda0dd', powderblue: 'b0e0e6', purple: '800080', red: 'ff0000', rosybrown: 'bc8f8f', royalblue: '4169e1',
        saddlebrown: '8b4513', salmon: 'fa8072', sandybrown: 'f4a460', seagreen: '2e8b57', seashell: 'fff5ee', sienna: 'a0522d', silver: 'c0c0c0', skyblue: '87ceeb', slateblue: '6a5acd', slategray: '708090', slategrey: '708090', snow: 'fffafa', springgreen: '00ff7f', steelblue: '4682b4',
        tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8', tomato: 'ff6347', turquoise: '40e0d0', violet: 'ee82ee', violetred: 'd02090', wheat: 'f5deb3', white: 'ffffff', whitesmoke: 'f5f5f5', yellow: 'ffff00', yellowgreen: '9acd32'
    },

    re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
    toRGB: function (){
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    },
    toHex: function () {
        var x = (1 << 24) | (this.r << 16) | (this.g << 8) | this.b;
        return '#' + Number(x).toString(16).substr(1,6);
    },
    toName: function() {
        var min = 1000;
        if (!this.name) { // compute the nearest name
            // iterate through all names 
            for (var key in this.namedColors) {
                if (!this.namedColors.hasOwnProperty(key)) continue;
                var v = parseInt(this.namedColors[key], 16);
                var r = (v >> 16) & 0xFF, g = (v >> 8) & 0xFF, b = v & 0xFF; 
                var d = Math.abs(this.r - r) + Math.abs(this.g - g) + Math.abs(this.b - b);
                if (d < min) {
                    min = d;
                    this.name = key;
                }
            }
        }
        return this.name;
    },
    derived: function(ratio) {
        var c = new RGBColor(this);
        c.r *= ratio ;
        c.g *= ratio;
        c.b *= ratio;
        c.name = null;
        return c;
    }
};

(function() {
    var cache = {};
    RGBColor.darker = function(color) {
        if (!cache[color])
            cache[color] = new RGBColor(color).derived(0.5);
        return cache[color];
    };
})();
        
RGBColor.prototype.toString = RGBColor.prototype.toHex;
