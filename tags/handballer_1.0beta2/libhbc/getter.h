#ifndef GETTER_H_
#define GETTER_H_
/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */
#include "hbc.h"

#ifdef __cplusplus
extern "C" {
#endif


/*
 * ----------------------
 * The getter generic callback
 * ----------------------
 */
typedef struct getter_s *getter_t ;

getter_t  getter_new() ;
int       getter_start(getter_t getter, char* super_pattern) ;
int       getter_stop(getter_t getter) ;
int       getter_get(getter_t getter, char *pattern,  hbc_callback_t callback, char *context) ;


#ifdef __cplusplus
}
#endif

#endif /* GETTER_H_ */
