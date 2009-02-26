
#ifndef DBG_MACRO
#define DBG_MACRO

// Let's be C++ friendly:
#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

#include <stdio.h>

#define ERR(e, ...) printf("ERROR in %s : %s() , line %d : " e "\n", __FILE__,__FUNCTION__,__LINE__, ##__VA_ARGS__)

#define DBG(e, ...) printf("DBG :%s : %s() , line %d : " e "\n", __FILE__,__FUNCTION__,__LINE__, ##__VA_ARGS__)

#ifdef __cplusplus
}
#endif /* __cplusplus */


#endif
