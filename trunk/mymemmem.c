/* mymemmem.c - the mymemmem function
*/


#include <string.h>

#include "mymemmem.h"

#ifdef memmem
#define mymemmem(B,L,SB,SL) memmem(B,S,SB,SL)
#else
void *mymemmem( const void* bin, size_t len, const void* subbin, size_t sublen) {
  if (!sublen) return bin;
  if (len < sublen) return NULL;

  {
    const char* begin = bin;
    const char* last = begin + len - sublen;
    const char* tail = subbin;
    char first = *tail++;
    sublen--;
    while (begin <= last) {
      if (*begin == first && !memcmp(begin + 1, tail, sublen))
        return (void*)begin;
      begin++;
    }
  }
  return NULL;
}
#endif
