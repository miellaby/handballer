/* matchc.h - tell if a pattern is a subset of an other pattern
*/

#ifndef _MATCHC_H_
#define _MATCHC_H_

/* Test the embedding of one sub pattern in a parent pattern. See match.h for pattern syntax.
*/
extern int matchc( const char* pattern, const char* subpattern );

#endif /* _MATCH_H_ */
