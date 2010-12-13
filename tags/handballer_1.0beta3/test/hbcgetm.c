/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Bus API test
 * 
 */

#include "getter.h"
#include "trace.h"


void callback_hello(char *channel, char *body, char *context)
{
  printf("hello_cb : channel='%s' body='%s'\n", channel, body) ;
}

void callback_world(char *channel, char *body, char *context)
{
  printf("world_cb : channel='%s' body='%s'\n", channel, body) ;
}

int main (int argc, char *argv[]) {
  
  char *channel ;
  char *body ;

  getter_t getter = getter_new () ;
  
  getter_get(getter, "hello/**", callback_hello, NULL) ;
  getter_get(getter, "world/**", callback_world, NULL) ;

  getter_start(getter, "hello/**|world/**") ;
  while (1) ;
}
