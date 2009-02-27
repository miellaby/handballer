#ifndef _GETTER_H_
#define _GETTER_H_
/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */
#include "getter.h"

/*
 * ----------------------
 * The getter generic callback
 * ----------------------
 */
typedef struct known_channel_list_s {
  char *channel ;
  unsigned int subgetter_map ;
  struct known_channel_list_s *next ;
} known_channel_list_t ;

typedef struct subgetter_s {
  char *pattern ;
  hbc_callback_t callback ;
  void* context ;
} subgetter_t ;

struct getter_s {
  int                   hbc_get_socket ;
  known_channel_list_t *known_channel_hash[255] ;
  subgetter_t           subgetters[32] ;
} ;

#endif /* _GETTER_H_ */
