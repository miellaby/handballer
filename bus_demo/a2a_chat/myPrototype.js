// occurences removal helper
if (Array.prototype.remove === undefined) {
   Array.prototype.remove = function(s){
      var i = this.indexOf(s);
      while (i != -1) {
         this.splice(i, 1);
         i = this.indexOf(s,i);
      }
   }
}

