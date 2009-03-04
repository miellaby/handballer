/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Bus API test
 * 
 */

#include "hbc.h"
#include "trace.h"

int main (int argc, char *argv[]) {
  if (argc == 0)
    {
      fprintf(stderr, "%s <channel> <message> <number>", argv[0]) ;
      return -1 ;
    }
  else
    {
      int i, n = atoi(argv[3]) ;
      for (i = 0 ; i < 1000 ; i ++)
        hbc_post(argv[1], argv[2]);
      return 0 ;
    }
}
