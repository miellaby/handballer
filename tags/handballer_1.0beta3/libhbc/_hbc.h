/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */

#ifndef _HBC_H_
#define _HBC_H_

#include "hbc.h"
#include <pthread.h>

/* Bus connection parameters */
#define HBC_DEFAULT_PORT 7007
#define HBC_DEFAULT_HOSTNAME "localhost"
#define HBC_DEFAULT_PREFIX "/bus/"

#define PARAM_STRING_MAX_LENGTH (1024)
#define PARAM_STRING_MAX_LENGTH_F "1023"
#define READ_BUFFER_MIN_LENGTH (1024)

struct s_socketTab {
  int socket ;
  int pid ;
  hbc_callback_t callback ;
  void* context;
  char *read_buffer ; // mallocated/reallocated buffer
  int   read_buffer_size ; // default to READ_BUFFER_MIN_LENGTH, current buffer size, may increase by factor 2 on need
  int   label_size ;
  char *label ; // will point to somewhere in the read buffer
  char *body ; // will point to somewhere in the read buffer
  unsigned long body_size ;
  int   read_offset ;
  int   header_offset ;
  int   labelSize_offset ;
  int   label_offset ;
  int   size_offset ;
  int   body_offset ;
  int   header_read ; // boolean
} socketTab[5] ;

int close_thread(pthread_t _thread_id) ;

int write_now(int fd, const void* buf, size_t nbytes ) ;

void* thread_loop(void *_socketTabEntry) ;


/** _hbcAddr BUS connection address */
static struct sockaddr_in _hbcAddr;

#endif /* _HBC_H_ */
