/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Handballer Bus Client API
 * 
 */

#ifndef HBC_H_
#define HBC_H_

#include <sys/time.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Bus connection parameters */
#define HBC_DEFAULT_PORT 7007
#define HBC_DEFAULT_HOSTNAME "localhost"
#define HBC_DEFAULT_PREFIX "/bus/"

// parameters current value
// may be set at runtime (before hbc_get() & relatives call )
extern int   hbc_port ;
extern char *hbc_hostname ;
extern char *hbc_prefix ;

/* Data structure */
/** Callback to 
 * @param messageToDisplay : message received from the BUS
 * @param context : callback context
 */
typedef void (*hbc_callback_t) (char* label, char* body, char *context);

// open a bus GET connection
// when callback != null, hbc_get() starts a dedicated thread which opens a "GET" bus connection and receives  messages on the fly. This thread calls the provided "callback" for each received message,
// when callback == null, hbc_get() just opens a connection and returns a sockId. The caller must manage scheduling by itself. One may create an applicative thread which may call the hbc_wait() method.
int hbc_get(char* labelPattern, hbc_callback_t callback, void* context) ;

// hbc_wait() waits for incoming message on the socket return by a former hbc_get() call without callback
// hbc_wait() returns on new message arrival.
// Provided output arguments are filled with corresponding body and label.
// Memory management Warning: string data upon the pointers will be freed at next hbc_wait() call. Please copy these data to store them permanently.
int hbc_wait(int hbcGetSocket, char **label, char **body) ;

// this function may be called before hbc_wait() to design a timeout based pooling
// it returns when a new message is available or timeout raised.
int hbc_poll(int hbcGetSocket, struct timeval *timeval_p) ;


// close a connection initiated by a former hbc_get() call.
void hbc_close(int hbcGetSocket);

// Send a bus message
int hbc_post(char *label, char *message) ;

#ifdef __cplusplus
}
#endif

#endif /* HBC_H_ */
