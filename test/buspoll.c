/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Bus API
 * 
 */

#include "hbc.h"
#include "trace.h"

int main (int argc, char *argv[]) {

  char *channel ;
  char *body ;

  int sockId = hbc_get(!argv[1] ? "**" : argv[1], NULL, NULL);
  printf("sockId=%d\n", sockId);

  while (1)
    {
      struct timeval tv;
      tv.tv_sec = 5 ;
      tv.tv_usec = 0;
      {
        int ret = hbc_poll(sockId, &tv) ;
        if (ret > 0)
          {
            printf("Message available.\n");
            if (hbc_wait(sockId, &channel, &body)) break ;
            printf("%s : %s\n", channel, body);
          }
        else if (ret < 0)
          {
            printf("Error in poll.\n");
            break ;
          }
        else 
          printf("timeout 5 seconds.\n") ;
      }
    }

  printf("Connection lost.\n");
  return 0;
}
