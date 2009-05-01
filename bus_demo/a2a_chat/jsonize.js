
Function.prototype.jsonize = function() { return undefined; }

Number.prototype.jsonize =
  Boolean.prototype.jsonize =
    function() { return String(this.valueOf()); };

(function() { // hidding closure


function f(n) { return n < 10 ? '0' + n : n; };

Date.prototype.jsonize = function (key) {
   return this.getUTCFullYear()   + '-' +
       f(this.getUTCMonth() + 1) + '-' +
       f(this.getUTCDate())      + 'T' +
       f(this.getUTCHours())     + ':' +
       f(this.getUTCMinutes())   + ':' +
       f(this.getUTCSeconds())   + 'Z';
};

var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escaped = {    // table of character substitutions
            '\b': '\\b',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
    };

function escapeSpecialChar(a) {
  if (escaped[a]) return escaped[a] ;
  return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
};

String.prototype.jsonize = function() {
  escapable.lastIndex = 0;
  return '"' + this.replace(escapable, escapeSpecialChar) + '"';
}

})(); // hidding closure

Array.prototype.jsonize = function() {
  var partial = [], v;
  // if (this.toString === [].toString)
  var i, j = 0, l = this.length;
  for (i = 0; i < l; i++) {
     v = jsonize(this[i]);
     if (v !== undefined) partial[j++] = v;
  }

  return '[' + partial.join(',') + ']';
}

Object.prototype.jsonize = function() {
  if (this.length !== undefined)
    return Array.prototype.jsonize.apply(this);

  if (this.className !== undefined)
      return "#DOMNode";

  var partial = [], v;
  for (k in this) {
      if (!this.hasOwnProperty(k)) continue;
      v = jsonize(this[k]);
      if (v !== undefined) partial.push(k.jsonize() + ':' + v);
  }

  return '{' + partial.join(',') + '}';
}

function jsonize(value) {
   if (value === undefined) return undefined;
   if (value == null) return "null";
   return value.jsonize();
}
