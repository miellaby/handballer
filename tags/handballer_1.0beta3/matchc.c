/* matchc.c - tell if a pattern is a subset of an other pattern
*/


#include <string.h>

#include "matchc.h"

static int matchc_one( const char* pattern, int patternlen, const char* sub, int sublen ) {
  const char* p;
  
  for ( p = pattern; p - pattern < patternlen; ++p, ++sub, --sublen )
    {
      if ( *p == '?' && *sub != '\0' && *sub != '*' ) /* beware: ? do NOT matchc wildcard */
        continue;
      if ( *p == '*' )
        {
          int i, pl;
          ++p;
          if ( *p == '*' )
            {
              /* Double-wildcard matchc anything. */
              ++p;
              i = sublen;
            }
          else {
            /* Single-wildcard matchc anything but slash nor double-wildcard */
            for (i = 0 ; i < sublen && sub[i] != '/' && (sub[i] != '*' || sub[i+1] != '*')  ; ++i);
          }
          pl = patternlen - ( p - pattern );
          for ( ; i >= 0; --i )
            if ( matchc_one( p, pl, &(sub[i]), sublen - i ) )
              return 1;
          return 0;
        }
      if ( *p != *sub )
        return 0;
    }
  if ( *sub == '\0' )
    return 1;
  return 0;
}


static int matchc_sub( const char* pattern, const char* sub, int sublen ) {
  const char* or;
  
  for (;;)
    { // this loop cuts parent pattern in "|" splices
      or = strchr( pattern, '|' );
      if ( or == (char*) 0 )
        return matchc_one( pattern, strlen( pattern ), sub, sublen );
      if ( matchc_one( pattern, or - pattern, sub, sublen ) )
        return 1;
      pattern = or + 1;
    }
}

int matchc( const char* pattern, const char* sub ) {
  const char* sr;

  for (;;)
    { // this loop cuts subpattern into "|" splices
      sr = strchr( sub, '|' );
      if ( sr == (char*) 0 )
        return matchc_sub( pattern, sub, strlen( sub ) );
      if ( matchc_sub( pattern, sub, sr - sub ) )
        return 1;
      sub = sr + 1;
    }
}
