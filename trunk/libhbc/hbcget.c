/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */

#include "hbc.h"
#include "trace.h"

int main (int argc, char *argv[]) {

  char *channel ;
  char *body ;

  int sockId = hbc_get((argc < 2 ? "**" : argv[1]), NULL, NULL);
  fprintf(stderr,"sockId %d\n", sockId);
  while (1) {
    if (hbc_wait(sockId, &channel, &body)) break ;
    fprintf(stdout,"%s : %s\n", channel, body);
    fflush(stdout);
  }
  fprintf(stderr,"Connection lost.\n");
  return 0;
}
