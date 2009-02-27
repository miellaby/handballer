/*---------------------------------------------------------------------------
 * Project : Hanballer
 * Sub Project : Trace system
 * Note: obviously copied from Philippe Houdoin's work
 */

#ifndef TRACE_H
#define TRACE_H

// Let's be C++ friendly:
#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */


#define NO_TRACES	0x0000
#define ALL_TRACES	0xFFFF

#define INFO_TRACES	0x1000
#define DEBUG_TRACES	0x2000
#define WARNING_TRACES	0x4000
#define ERROR_TRACES	0x8000
#define FATAL_TRACES	0x0100
#define ASSERT_TRACES	0x0200
  
#ifndef SHOW_TRACES
	// Default to no traces
	#define SHOW_TRACES NO_TRACES
#elif (SHOW_TRACES) == 1
	// Backward compatibily when SHOW_TRACES was considered a boolean
	#undef SHOW_TRACES
	#define SHOW_TRACES ALL_TRACES
#endif

#include <stdio.h>	/* For fprintf() and stderr */
#include <stdlib.h>	/* For exit() */
#include <string.h>	/* For fprintf() */
#include <errno.h>	/* For errno & strerror() */

#ifndef TRACE_STREAM
	/* Default trace output stream */
	#define TRACE_STREAM	stderr
#endif

/* Beware: these macros assert GCC >= 2.95.3 */

#ifndef TRACE_PREFIX
	/* Default trace prefix */
	#define TRACE_PREFIX	"%s:%s(),%d: ", __FILE__, __FUNCTION__, __LINE__
#endif

#ifdef NOCOLOR_TRACES
// Do NOT colorize traces!

#define TRACE_FATAL_PREFIX	"FATAL:   "
#define TRACE_ERROR_PREFIX	"Error:   "
#define TRACE_WARNING_PREFIX	"Warning: "
#define TRACE_DEBUG_PREFIX	"Debug:   "
#define TRACE_INFO_PREFIX	"Info:    "
#define TRACE_MSG_SUFFIX

#else

// Bring some colors to traces ;-)

#define TRACE_FATAL_PREFIX	"\033[31mFATAL:   "
#define TRACE_ERROR_PREFIX	"\033[31mError:   "
#define TRACE_WARNING_PREFIX	"\033[33mWarning: "
#define TRACE_INFO_PREFIX	"Info:    "
#define TRACE_DEBUG_PREFIX	"\033[32mDebug:   "
#define TRACE_MSG_SUFFIX	"\033[0m"

#endif	// NOCOLOR undefined

#define TRACE(level, format, ...) \
	do { \
		if ((SHOW_TRACES) & level) { \
			fprintf(TRACE_STREAM, TRACE_PREFIX); \
			fprintf(TRACE_STREAM, format TRACE_MSG_SUFFIX "\n" , ##__VA_ARGS__); \
		} \
	} while(0)
	
#define FATAL(text, ...) 	do { TRACE(FATAL_TRACES, TRACE_FATAL_PREFIX text, ##__VA_ARGS__); exit(-1); } while(0)

#define ERROR(text, ...) 	TRACE(ERROR_TRACES, TRACE_ERROR_PREFIX text, ##__VA_ARGS__)
#define WARNING(text, ...) 	TRACE(WARNING_TRACES, TRACE_WARNING_PREFIX text, ##__VA_ARGS__)
#define WARN(text, ...)	 WARNING(text, ##__VA_ARGS__)
#define INFO(text, ...) 	TRACE(INFO_TRACES, TRACE_INFO_PREFIX text, ##__VA_ARGS__)
#define DBG(text, ...) 		TRACE(DEBUG_TRACES, TRACE_DEBUG_PREFIX text, ##__VA_ARGS__)

#define ASSERT(exp) \
	if (!(exp)) \
		TRACE(ASSERT_TRACES, TRACE_ERROR_PREFIX "Assertion failed: " #exp)



#ifdef __cplusplus
}
#endif /* __cplusplus */


#endif /* TRACE_H */

