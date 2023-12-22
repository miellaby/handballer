/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */

#include "hbc.h"
#include "trace.h"


void printHelp() {
    printf("Usage: hbcget [-n] CHANNEL_PATTERN\n");
    printf("Options:\n");
    printf("  -n    Separate messages with null character (\\0) instead of newline\n");
}

int main (int argc, char *argv[]) {

  int useNullSeparator = 0;  // Default is no null separator
  char *channel ;
  char *body ;

  // Check for command-line options
  for (int i = 1; i < argc; i++) {
      if (argv[i][0] == '-') {
          if (argv[i][1] == 'n') {
              useNullSeparator = 1;
          } else if (argv[i][1] == 'h') {
              printHelp();
              return 0;
          } else {
              fprintf(stderr, "Unknown option: %s\n", argv[i]);
              return 1;
          }
      }
  }

  int sockId = hbc_get((argc < 2 ? "**" : argv[1]), NULL, NULL);
  fprintf(stderr,"sockId %d\n", sockId);
  while (1) {
    if (hbc_wait(sockId, &channel, &body)) break ;
    if (useNullSeparator) {
        fprintf(stdout, "%s : %s%c", channel, body, '\0');
    } else {
        fprintf(stdout, "%s : %s\n", channel, body);
    } 
    fflush(stdout);
  }
  fprintf(stderr,"Connection lost.\n");
  return 0;
}
