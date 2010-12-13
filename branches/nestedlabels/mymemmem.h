/* mymemmem.h - define the mymemmem function
*/

#ifndef _MYMEMMEM_H_
#define _MYMEMMEM_H_

/* Look for /subbin/ -a sequence of /sublen/ bytes- into /bin/ -a sequence of /len/ bytes- */
extern void *mymemmem( const void* bin, size_t len, const void* subbin, size_t sublen);

#endif

