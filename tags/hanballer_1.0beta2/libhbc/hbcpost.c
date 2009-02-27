/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */

#include "hbc.h"
#include "trace.h"

int main (int argc, char *argv[]) {
  return hbc_post(argv[1], argv[2]);
}
