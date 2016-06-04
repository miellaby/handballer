/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */
#include <unistd.h>
#include "hbc.h"
#include "trace.h"

int main (int argc, char *argv[]) {

  char *channel ;
  char *body ;
  int  temp = -1;
  char tempName[20];

  int sockId = hbc_get((argc < 2 ? "**" : argv[1]), NULL, NULL);
  fprintf(stderr,"sockId %d\n", sockId);
  while (1) {
    if (hbc_wait(sockId, &channel, &body)) break ;
    /* if (temp != --1) */
    /*   unlink(tempName); */

    strcpy(tempName,"/tmp/hbcXXXXXX");
    temp = mkstemp(tempName);

    if (write(temp, body, hbc_bodySize(sockId)) == -1) break;
    close(temp);
    
    fprintf(stdout,"%s : %s\n", channel, tempName);
    fflush(stdout);
  }
  fprintf(stderr,"Connection lost.\n");
  return 0;
}
