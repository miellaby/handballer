/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Hanballer Bus Client API
 * 
 */
#include "_getter.h"
#include <stdlib.h>
#include <string.h>
#include "../match.h"
#include "trace.h"

getter_t getter_new() {
  getter_t new_getter = (getter_t)malloc(sizeof(struct getter_s)) ;

  DBG("getter_new() = %p", new_getter) ;
  
  new_getter->hbc_get_socket = -1 ;
  memset (new_getter->subgetters, 0, sizeof(new_getter->subgetters)) ;
  memset (new_getter->known_channel_hash, 0, sizeof(new_getter->known_channel_hash)) ;
  
  return new_getter ;
}

void getter_callback (char* channel, char* body, char *context)
{
  int i ;
  getter_t getter = (getter_t)context ;
  char *c ;
  unsigned char xor8 = 0 ;
  known_channel_list_t *list ;
  unsigned int map = 0 ;
  unsigned int bit = 1 ;
  c = channel ;
  while (*c) xor8 ^= *c++ ;

  DBG("getter_callback('%s', '%s', %p)", channel, body, context) ;

  list = getter->known_channel_hash[xor8] ;
  
  while (list && strcmp(list->channel, channel))
    list=list->next ;

  if (list)
    // already seen channel, retrieve the computed map
    map = list->subgetter_map  ;
  else
    { // never seen channel
      known_channel_list_t *new_known_channel_list = (known_channel_list_t *)malloc(sizeof(known_channel_list_t)) ;
      int i ;

      // compute the corresponding subgetters map
      map = 0 ;
      for (i = 0 ; i < 31 ; i++)
        {
          if (getter->subgetters[i].pattern && match(getter->subgetters[i].pattern, channel))
            map |= bit ;
          bit <<= 1 ;
        }
      
      new_known_channel_list->next = getter->known_channel_hash[xor8] ;
      new_known_channel_list->channel = strdup(channel) ;
      new_known_channel_list->subgetter_map = map ;
      getter->known_channel_hash[xor8] = new_known_channel_list ;
    }

  // call each subgetter recorded into the channel's map
  bit = 1 ;
  for (i = 0 ; i < 31 ; i ++)
    {
      if (map & bit)
        getter->subgetters[i].callback(channel,body,getter->subgetters[i].context) ;
      bit <<= 1 ;
    }
}

int getter_start(getter_t getter, char *super_pattern)
{
  int hbcGetSocket ;

  DBG("getter_start(%p, '%s')", getter, super_pattern) ;
		  
  if (getter->hbc_get_socket != -1)
    {
      hbc_close(getter->hbc_get_socket) ;
      // reset known pattern
      memset (getter->known_channel_hash, 0, sizeof(getter->known_channel_hash)) ;
    }
  if (super_pattern != NULL)
    getter->hbc_get_socket = hbc_get(super_pattern, getter_callback, getter) ;
  else
    getter->hbc_get_socket = -1 ;

  return getter->hbc_get_socket ;
}

int getter_stop(getter_t getter) 
{
  DBG("getter_stop(%p)", getter) ;
  getter_start(getter, NULL) ;
}

int getter_get(getter_t getter, char *pattern,  hbc_callback_t callback, char *context)
{
  int i= 0 ;

  DBG("getter_get(%p, '%s', %p, %p)", getter, pattern, callback, context) ;

  while (i<=31)
    {
      if (!getter->subgetters[i].pattern) break ;
      i++ ;
    }

  if (i > 31)
   {
    ERROR("No available subgetter") ;
    return -1 ;
   }
  
  getter->subgetters[i].pattern = strdup(pattern) ;
  getter->subgetters[i].callback = callback ;
  getter->subgetters[i].context = context ;
  return 0 ;
}
