#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <syslog.h>
#include <errno.h>

#include "config.h"
#include "libhttpd.h"
#include "_libhttpd.h"
#include "match.h"
#include "matchc.h"
#include "timers.h"
#include "mymemmem.h"
#include "handballer.h"

static int   BOX_KEEP_TIME = 3;
static char* ok200title = "OK";
static char* err403title = "Forbidden";
static char* err501title = "Not Implemented";

/* Append string to server response buffer */
static void add_response_buffer( httpd_conn* hc, char* str )
    {
    size_t len;

    len = strlen( str );
    httpd_realloc_str( &hc->response, &hc->maxresponse, hc->responselen + len );
    (void) memmove( &(hc->response[hc->responselen]), str, len );
    hc->responselen += len;
    }

/* Append string to client request buffer */
static void add_client_buffer( client_conn *cc, char *str )
  {
  int l = (str ? strlen(str) : 0) ;
  if (l)
    {
    httpd_realloc_str( &cc->buffer, &cc->maxbuffer, cc->bufferlen + l);
    (void) memcpy( &(cc->buffer[cc->bufferlen]), str, l );
    cc->bufferlen+= l ;
    }
  }

/* Message with ref# */
typedef struct msg_s {
  char* label;
  char* body;
  char* contenttype;
  char* escaped;
  size_t len;
  size_t escaped_len;
  unsigned ref_count;
} msg_t ;

/* Message list */
typedef struct msg_list_s {
  msg_t* msg;
  struct msg_list_s* next;
} msg_list_t ;

/* Box */
typedef struct box_s {
  httpd_server* hs;
  httpd_conn* bound_client;
  char* key;
  char* cookie;
  char* pattern;
  msg_list_t* first_msg;
  msg_list_t* last_msg;
  struct box_s* prev;
  struct box_s* next;
  Timer* free_timer;
} box_t ;

static msg_t* msg_create(char *label, char* body, size_t len, char* contenttype) {
  msg_t* msg = (msg_t *)malloc(sizeof(msg_t));
  if (!msg) return NULL;
  
  msg->body = (char *)malloc(sizeof(char)*len);
  if (!msg->body) { free(msg); return NULL; }
  memcpy(msg->body, body, len);
  msg->len = len;
  msg->label = strdup(label);
  if (!msg->label) { free(msg->body); free(msg); return NULL;}
  msg->ref_count = 0;

  msg->contenttype = (contenttype ? strdup(contenttype) : NULL); 

  msg->escaped=NULL;
  msg->escaped_len=0;

  return msg;
}

static void msg_free(msg_t* m) {
  if (!m) return;
  free (m->label);
  free (m->body);
  if (m->escaped && m->escaped != m->body) free(m->escaped);
  free (m);
}

static char* create_handballer_cookie() {
  static unsigned i=123456;
  i++;
  char tmp[40];
  sprintf(tmp, "%X", i);
  return strdup(tmp + 2);
}

static box_t* box_create(httpd_server* hs, char *key, char *pattern) {
  box_t* box = (box_t*)malloc(sizeof(box_t));
  box->hs = hs;
  box->bound_client = NULL;
  box->pattern = strdup(pattern);
  box->key = (key? strdup(key) : NULL);
  box->cookie = (key? create_handballer_cookie() : NULL) ;
  box->first_msg = NULL;
  box->last_msg = NULL;
  box->free_timer = NULL;

  box->prev = NULL;
  box->next = hs->box_list;
  hs->box_list = box;
  if (box->next) box->next->prev = box;

  TRACE(hs->logfp, "CREA Box %p listening to '%.200s'", box, box->pattern);
  return box;
}

static int box_bind(box_t* box, httpd_conn* bound_client) {
  // link client, unlinking previous one if any
  if (box->bound_client && box->bound_client != bound_client) box->bound_client->msg_box = NULL;
  box->bound_client = bound_client;

  if ( box->free_timer != NULL)
    {
      tmr_cancel( box->free_timer );
      box->free_timer = NULL;
    }

  return 0;
}

static box_t* box_find(httpd_server* hs, char* cookie, char* clientkey) {

  // look for box dedicated cookie into client cookies
  char *clientcookies = cookie ;
  char *handballer_box_cookie=NULL;
  int  clientkeylen = strlen(clientkey);
  
  // TRACE(hs->logfp, "EXTRACT handballer_%.200s COOKIE IN '%.200s'", clientkey, clientcookies);
  while (clientcookies)
    {
      while (*clientcookies == ' ') clientcookies++;
      if (0 == strncmp(clientcookies, "handballer_", 11) && 0 == strncmp(clientcookies + 11, clientkey, clientkeylen) && clientcookies[11 + clientkeylen] == '=')
        handballer_box_cookie = clientcookies + 12 +clientkeylen;

      clientcookies = strchr(clientcookies, ';');
      if (clientcookies) {
        *clientcookies++ = '\0' ;
      }
    }

  // no box cookie found in client cookies
  if (!handballer_box_cookie) {
    TRACE(hs->logfp, "NO HANDBALLER COOKIE");
    return NULL;
  }
  // TRACE(hs->logfp, "LOOK FOR Box with x-ref ('%.200s','%.200s')", clientkey, handballer_box_cookie);

  // to be optimized through hash_table
  box_t* found = hs->box_list;
  while (found && !(found->key && found->cookie && !strcmp(found->key, clientkey) && !strcmp(found->cookie, handballer_box_cookie)))
    found = found->next;

  if (found) {
    TRACE(hs->logfp, "FOUND BOX %p with x-ref ('%.200s','%.200s')",  found, clientkey, handballer_box_cookie);
  } else {
    TRACE(hs->logfp, "NO BOX with x-ref ('%.200s','%.200s')", clientkey, handballer_box_cookie);
  }
  // return a box if clientkey & cookie match
  return found;
}

int box_free(box_t* box) {
  if (box->prev)
    box->prev->next = box->next ;
  else
    box->hs->box_list = box->next ;
  if (box->next) box->next->prev = box->prev;
 
  TRACE(box->hs->logfp, "FREE Box %p listening to %s", box, box->pattern);

  free(box->pattern);
  if (box->key) free(box->key);
  if (box->cookie) free(box->cookie);



  free(box);
  return 0;
}

static void box_free_timerCB(ClientData client_data, struct timeval* nowP ) {
  box_free(client_data.p);
}

int box_unbind(box_t* box) {
  ClientData client_data;

  box->bound_client->msg_box = NULL;
  box->bound_client = NULL;
  if (!box->key)
    return (box_free(box), 0) ;
  else {
    /* Schedule a box out-of-dating */
    client_data.p = box; 
    box->free_timer = tmr_create( (struct timeval*) 0, box_free_timerCB, client_data, BOX_KEEP_TIME * 1000L, 0 );

    if ( box->free_timer == (Timer*) 0 )
      {
        syslog( LOG_CRIT, "tmr_create(box_unbind) failed" );
        exit( 1 );
      }
  }
    
  return 0;
}

static int box_add_to_queue(box_t* box, msg_t* msg) {
  msg_list_t* msg_list = (msg_list_t*)malloc(sizeof(msg_list_t));
  if (!msg_list) return -1;
  msg_list->next = NULL;
  msg_list->msg = msg;
  msg->ref_count++;

  if (box->last_msg)
    box->last_msg->next = msg_list;
  else
    box->first_msg = box->last_msg = msg_list;

  TRACE(box->hs->logfp, "Queue Message %p in Box %p", msg, box);

  /* if the box is bound to a client and this client is starving, one feeds it */
  if (box->bound_client && box->bound_client->responselen == 0)
    get_message_from_box(box->bound_client);

  return 0;
}

static int box_remove_head(box_t* box) {
  if (!box->first_msg) return -1;
  msg_list_t* msg_list = box->first_msg;
  box->first_msg = msg_list->next;
  if (!box->first_msg) box->last_msg = NULL;
  
  if ((--msg_list->msg->ref_count) == 0) {
    TRACE(box->hs->logfp, "FREE Msg %p", msg_list->msg);
    msg_free(msg_list->msg);
  }
  free(msg_list);
  return 0;
}

int get_message_from_box(httpd_conn* get_hc) {

  box_t *box;
  char  *label;
  char  *body;
  size_t body_len;
  int    label_needed = (get_hc->bus_flags & BUS_LABEL_MODE);

  box = get_hc->msg_box;

  if (!box) return 1; /* NO BOX */
  if (!box->first_msg) return 2; /* NO MSG */

  /* get the message data */
  msg_t* msg = box->first_msg->msg;
  label = msg->label;
  body = msg->body;
  body_len  = msg->len;
  char *escaped = msg->escaped;
  size_t escaped_len = msg->escaped_len;

  TRACE(get_hc->hs->logfp, "LOAD MSG %p in suscriber %p response", msg, get_hc);
          
  /* what to put before the message */
  /**********************************/
  if (get_hc->bus_flags & BUS_SCRIPT_MODE)
    {
      add_response_buffer(get_hc, "<SCRIPT>") ;
      add_response_buffer(get_hc, get_hc->bus_getparam) ;
      add_response_buffer(get_hc, "(\'") ;
      if (label_needed)
        {
          add_response_buffer(get_hc, label) ;
          add_response_buffer(get_hc, "\',\'") ;
        }
    }
  else if (get_hc->bus_flags & BUS_NETSCAPEPUSH_MODE)
    {
      char strvalue[22] ;
      if (get_hc->one_one)
        {
          if (0 && /* USELESS */ !(get_hc->bus_flags & BUS_ONE_SHOOT_DONE))
            {
              snprintf(strvalue, sizeof(strvalue), "%p", (void *)(48 + 2 * strlen(get_hc->bus_getparam) + strlen(msg->contenttype) + strlen(label) + body_len)) ;
              add_response_buffer(get_hc, strvalue + 2) ; // avoid 0x
              add_response_buffer(get_hc, "\015\012--") ;
              add_response_buffer(get_hc, get_hc->bus_getparam) ;
            }
          else
            {
              snprintf(strvalue, sizeof(strvalue), "%p", (void *)(44 + strlen(get_hc->bus_getparam) + strlen(msg->contenttype) + strlen(label) + body_len)) ;
              add_response_buffer(get_hc, strvalue + 2) ; // avoid 0x
            }
          add_response_buffer(get_hc, "\015\012Content-Type: ") ;
          add_response_buffer(get_hc, msg->contenttype) ;
          add_response_buffer(get_hc, "\015\012Content-Location: ") ;
          add_response_buffer(get_hc, label) ;
          add_response_buffer(get_hc, "\015\012\015\012") ;
        }
      else
        {
          if (0 && /* USELESS */ !(get_hc->bus_flags & BUS_ONE_SHOOT_DONE))
            {
              add_response_buffer(get_hc, "--") ;
              add_response_buffer(get_hc, get_hc->bus_getparam) ;
              add_response_buffer(get_hc, "\015\012") ;
            }
          add_response_buffer(get_hc, "Content-Type: ") ;
          add_response_buffer(get_hc, msg->contenttype) ;
          add_response_buffer(get_hc, "\015\012Content-Length: ") ;
          snprintf(strvalue, sizeof(strvalue), "%ld", body_len) ;
          add_response_buffer(get_hc, strvalue) ;
          add_response_buffer(get_hc, "\015\012Content-Location: ") ;
          add_response_buffer(get_hc, label) ;
          add_response_buffer(get_hc, "\015\012\015\012") ;
        }
    }
  else if (get_hc->bus_flags & BUS_INDEXED_MODE)
    { // INDEXED MODE
      char hexa[10] ;
      
      if (label_needed)
        {
          char hexaC[10] ;
          snprintf(hexaC, 10, "%.8lX\n", 0xFFFFFFFF & strlen(label)) ;
          add_response_buffer(get_hc, hexaC) ;
          add_response_buffer(get_hc, label) ;
        }
      
      snprintf(hexa, 10, "%.8lX\n", 0xFFFFFFFF & body_len) ;
      add_response_buffer(get_hc, hexa) ;
    }
  else if (get_hc->bus_flags & BUS_NULL_MODE)
    { // NULL MODE
      if (label_needed)
        {
          add_response_buffer(get_hc, label) ;
          add_response_buffer(get_hc, " ") ; // little trick to add a null byte without effort
          get_hc->response[get_hc->responselen - 1] = '\0' ;
        }
    }
  else if (get_hc->bus_flags & BUS_EVENTSTREAM_MODE)
    {
      add_response_buffer(get_hc, "Event: message\n") ;
      if (label_needed)
        {
          add_response_buffer(get_hc, "data: ") ;
          add_response_buffer(get_hc, label) ;
          add_response_buffer(get_hc, "\n") ;
        }
      add_response_buffer(get_hc, "data: ") ;
    }
  else
    {
      TRACE(get_hc->hs->logfp, "%p NO MODE BUG", get_hc);
    }
  /* 		  else */
  /* 			{ // DEFAULT MODE  */
  /* 			  char strvalue[22] ; */
  
  /*               if (label_needed) */
  /*                 { */
  /* 				  add_response_buffer(get_hc, label) ; */
  /* 				  add_response_buffer(get_hc, "\n") ; */
  /*                 } */
  
  /* 			  snprintf(strvalue, sizeof(strvalue), "%d\n", body_len) ; */
  /* 			  add_response_buffer(get_hc, strvalue) ; */
  /*             } */
  
  get_hc->bus_flags |= BUS_ONE_SHOOT_DONE ;
  
  /* quote escaped string computed on purpose */
  if ((get_hc->bus_flags & BUS_SCRIPT_MODE) && !escaped)
    {
      off_t r ;
      for (r = 0 ; r < body_len && body[r] && body[r] != '\'' && body[r] != '\\' ; r++)
        /* quote search loop */ ;
      
      if (r >= body_len)
        {
          escaped = body ;
          escaped_len  = body_len ;
        }
      else
        {
          size_t escaped_maxlen = 0;
          off_t c1 = 0 ;
          off_t c2 = 0 ;
          do 
            {
              httpd_realloc_str( &escaped, &escaped_maxlen, escaped_len + r + 2 );
              (void) memcpy( escaped + c1, body + c2, r );
              c1 += r ;
              escaped[c1++] = '\\' ;
              escaped[c1++] = (body[c2 + r] ? body[c2 + r] : '0') ;
              escaped_len += r + 2 ;
              c2 += r + 1 ;
              for (r = 0 ; c2 + r < body_len && body[c2 + r] != '\''  && body[c2 + r] != '\\' ; r++)
                /* quote search loop */ ;
            }
          while (c2 + r < body_len) ;

          if (r > 0)
            {
              httpd_realloc_str( &escaped, &escaped_maxlen, escaped_len + r);
              (void) memcpy( escaped + c1, body + c2, r );
              escaped_len += r ;
            }
        }
      msg->escaped   = escaped;
      msg->escaped_len    = escaped_len;
 
      TRACE(get_hc->hs->logfp, "<BUS><ESCAPED>%.*s</ESCAPED></BUS>", (int)escaped_len, escaped);
    }
  
  
  /* Message copy - we dont use add_response_buffer() as it won't work with non null-terminated data */
  if (get_hc->bus_flags & BUS_SCRIPT_MODE)
    {
      httpd_realloc_str( &get_hc->response, &get_hc->maxresponse, get_hc->responselen + msg->escaped_len );
      (void) memcpy( &(get_hc->response[get_hc->responselen]), msg->escaped, escaped_len );
      get_hc->responselen+= escaped_len;
    }
  else
    {
      httpd_realloc_str( &get_hc->response, &get_hc->maxresponse, get_hc->responselen + body_len );
      (void) memcpy( &(get_hc->response[get_hc->responselen]), body, body_len );
      get_hc->responselen+= body_len;
    }
  
  /* what to put after the message  */
  /**********************************/
  if (get_hc->bus_flags & BUS_SCRIPT_MODE)
    { // SCRIPT MODE : script sequence end
      add_response_buffer( get_hc, "\');</SCRIPT>\015\012" ) ;
      if (get_hc->bus_flags & BUS_FLUSH_MODE && get_hc->bus_flags & BUS_SCRIPT_RELOAD)
        {
          add_response_buffer( get_hc, "<SCRIPT>window.location.reload();</SCRIPT>\015\012" ) ;
        }
    }
  else if (get_hc->bus_flags & BUS_NETSCAPEPUSH_MODE)
    { // PUSH MODE : DELIMITER AFTER EACH MESSAGE
      add_response_buffer(get_hc, "\015\012--") ;
      add_response_buffer(get_hc, get_hc->bus_getparam) ;
      add_response_buffer( get_hc, "\015\012" ) ;
      if (get_hc->one_one)
        add_response_buffer(get_hc, "\015\012") ;
    }
  else if (get_hc->bus_flags & BUS_INDEXED_MODE)
    { // INDEXED MODE : \n after message
      add_response_buffer( get_hc, "\n" ) ;
    }
  else if (get_hc->bus_flags & BUS_NULL_MODE)
    { // NULL MODE : null terminate body (which is not supposed to have null byte; you're warned)
      add_response_buffer(get_hc, " ") ; // little trick to add a null byte without effort
      get_hc->response[get_hc->responselen - 1] = '\0' ;
    }
  else if (get_hc->bus_flags & BUS_EVENTSTREAM_MODE)
    { // EVENT MODE : \n\n
      add_response_buffer( get_hc, "\n\n" ) ;
    }
  /* 		  else // DEFAULT MODE : \n */
  /*             add_response_buffer( get_hc, "\n" ) ; */

  /* remove the message from the box queue */
  box_remove_head(box);

  /* tell the underlying software new data have to be sent through this connection */
  if (get_hc->newdata_callbackcontext && get_hc->hs->newdata_callback)
    get_hc->hs->newdata_callback( get_hc->newdata_callbackcontext ) ;

  return 0 ;
}

static int bus_forward_post(httpd_conn* hc, char *label, char *body, int body_len, char*contenttype) {
  msg_t* m ; 
  box_t* b;

  /* create a message with ref counter */
  m = msg_create(label, body, body_len, contenttype);
  m->ref_count++; // we don't want the message to be freed during the box loop

  for ( b = hc->hs->box_list ; b != NULL ; b = b->next ) /* box loop */
    if (match(b->pattern, label))
      { /* if the box subscripting pattern matches the label */

        /* add the message in the box queue */
        box_add_to_queue(b, m);
      }

  if ((--m->ref_count) == 0) {
    TRACE(hc->hs->logfp, "FREE NOW Msg %p", m);
    msg_free( m ) ;
  }

  return 0 ;
}

int
bus( httpd_conn* hc )
    {
    int r;
    char *parameter = ( hc->query && *hc->query != '\0' ? hc->query : NULL) ;

    // default response MIME type
    hc->type = "text/plain; charset=%s";

    if ( hc->method == METHOD_GET )
      { // METHOD GET
        char *script_cb = NULL ;
        char *push_delimiter = NULL ;
        char *indexed = NULL ;
        char *null = NULL ;
        char *box = NULL ;
        char *event = NULL ;
        char *label = NULL ;
        char *flush = NULL ;
        char *reload = NULL ;
        char *post_in_get = NULL ;
        char *extraheaders = BUS_EXTRA_HEADERS ;
        char  extraheaders_with_setcookie[1024] ;
        int   dyn_extraheaders = 0;

        TRACE( hc->hs->logfp, "<BUS REQUEST=%.200s><QUERY>%.200s</QUERY></BUS>", hc->pathinfo, hc->query );

        while (parameter)
          {
            if (0 == strncmp(parameter, "script=", 7))
              script_cb = parameter + 7 ;
            else if (0 == strncmp(parameter, "push=", 5))
              push_delimiter = parameter + 5 ;
            else if (0 == strncmp(parameter, "label", 5))
              label = parameter ;
            else if (0 == strncmp(parameter, "flush", 5))
              flush = parameter ;
            else if (0 == strncmp(parameter, "reload", 6))
              reload = parameter ;
            else if (0 == strncmp(parameter, "post=", 5))
              post_in_get = parameter + 5 ;
            else if (0 == strncmp(parameter, "indexed", 7))
              indexed = parameter ;
            else if (0 == strncmp(parameter, "null", 4))
              null = parameter ;
            else if (0 == strncmp(parameter, "box=", 4))
              box = parameter + 4 ;
            else if (0 == strncmp(parameter, "event", 5))
              event = parameter ;

            parameter = strchr(parameter + 1, '&') ;
            if (parameter)
              *parameter++ = '\0' ;
          }
        
        if (script_cb)
          {
            TRACE( hc->hs->logfp, "<BUS><MODE NAME=SCRIPT PARAM=%.200s/></BUS>", script_cb);
            hc->bus_flags |= BUS_SCRIPT_MODE;
            httpd_realloc_str(&hc->bus_getparam, &hc->bus_maxgetparam, strlen(script_cb)) ;
            strcpy(hc->bus_getparam, script_cb) ;
            
            if (reload)
              {
                hc->bus_flags |= BUS_SCRIPT_RELOAD ;
              }
          }
        else if (push_delimiter)
          {
            TRACE( hc->hs->logfp, "<BUS><MODE NAME=PUSH PARAM=%.200s/></BUS>'", push_delimiter);
            hc->bus_flags |= BUS_NETSCAPEPUSH_MODE;
            httpd_realloc_str(&hc->bus_getparam, &hc->bus_maxgetparam, strlen(push_delimiter)) ;
            strcpy(hc->bus_getparam, push_delimiter) ;
          }
        else if (event)
          {
            TRACE( hc->hs->logfp, "<BUS><MODE NAME=EVENT/></BUS>");
            hc->bus_flags |= BUS_EVENTSTREAM_MODE;
          }
        else if (null)
          {
            TRACE( hc->hs->logfp, "<BUS><MODE NAME=NULL/></BUS>");
            hc->bus_flags |= BUS_NULL_MODE;
          }
        else /* if (indexed) */
          {
            TRACE( hc->hs->logfp, "<BUS><MODE name=INDEXED</BUS>");
            hc->bus_flags |= BUS_INDEXED_MODE;
          }
        
        if (box)
          {
            TRACE( hc->hs->logfp, "<BUS><OPTION NAME=MSG_BOX/></BUS>");
            hc->bus_flags |= BUS_BOX_MODE;
          }

        if (label)
          {
            hc->bus_flags |= BUS_LABEL_MODE ;
          }
        
        if (flush)
          {
            hc->bus_flags |= BUS_FLUSH_MODE ;
          }

        if (post_in_get)
          {
            strdecode(post_in_get, post_in_get) ;
            TRACE( hc->hs->logfp, "<BUS><POST_IN_GET>%.200s</POST_IN_GET></BUS>", post_in_get);
          }

        if (strlen(hc->pathinfo))
          { // real bus request (pattern non null)
        
            hc->status = 200;
            hc->bytes_sent = -1;
            hc->should_linger = 0;

            /*
             * create or retrieve box
             */
            if (hc->bus_flags & BUS_BOX_MODE)
              {
                hc->msg_box = box_find(hc->hs, hc->cookie, box) ;
                if (!hc->msg_box)
                  hc->msg_box = box_create(hc->hs, box /* parameter = clien_key */, hc->pathinfo);

              } else {
                hc->msg_box = box_create(hc->hs, NULL, hc->pathinfo);
              }
            box_bind(hc->msg_box, hc);

            /*
             * Send BUS GET preambule
             */
            if (hc->bus_flags & BUS_SCRIPT_MODE)
              {
                hc->type = "text/html; charset=%s";
              }
            else if (hc->bus_flags & BUS_NETSCAPEPUSH_MODE)
              {
                char *btype ;
                hc->type = "multipart/x-mixed-replace; boundary=" ;
                btype = NEW(char, (strlen(hc->type) + strlen(hc->bus_getparam))) ;
                // hc->one_one = 0 ;
                // hc->protocol = "HTTP/1.0";
                if (btype)
                  {
                    strcpy(btype, hc->type) ;
                    strcat(btype, hc->bus_getparam);
                    hc->type = btype ;
                  }
                else
                  {
                    syslog( LOG_CRIT, "out of memory allocating a content-type." );
                    return -1;
                  }
                if (hc->one_one)
                  extraheaders = BUS_EXTRA_HEADERS "Transfer-Encoding: chunked\015\012";
              }
            else if (hc->bus_flags & BUS_EVENTSTREAM_MODE)
              {
                hc->type = "text/event-stream" ;
              }
            
            if (hc->msg_box->cookie) {
              snprintf(extraheaders_with_setcookie, 1024, "%sSet-Cookie: handballer_%s=%s;\015\012", extraheaders, hc->msg_box->key, hc->msg_box->cookie);
              send_mime( hc, 200, ok200title, hc->encodings, extraheaders_with_setcookie, hc->type, (off_t) -1, (time_t) -1 );
            } else {
              send_mime( hc, 200, ok200title, hc->encodings, extraheaders, hc->type, (off_t) -1, (time_t) -1 );
            }

            if (hc->bus_flags & BUS_NETSCAPEPUSH_MODE)
              { // free dynamical type
                char strvalue[22] ;
                if (hc->one_one)
                  {
                    snprintf(strvalue, sizeof(strvalue), "%p\015\012", (void *)(4 + strlen(hc->bus_getparam))) ;
                    add_response_buffer(hc, 2 + strvalue) ;
                  }
                add_response_buffer(hc, "--") ;
                add_response_buffer(hc, hc->bus_getparam) ;
                add_response_buffer(hc, "\015\012") ;
                if (hc->one_one)
                   add_response_buffer(hc, "\015\012") ;
                free(hc->type) ;
                hc->type = "";
              }

            if (hc->bus_flags & BUS_SCRIPT_MODE)
              {
                add_response_buffer(hc, "<HTML><BODY>\n") ;
#if 1 // needed
                {
                  char buffer[512] ;
                  // Padding with spaces to go through most buffering proxy
                  memset(buffer,' ', sizeof(buffer)) ;
                  buffer[sizeof(buffer)-1] = '\0' ;
                  add_response_buffer(hc, buffer) ;
                  add_response_buffer(hc, "\n") ;
                }
#endif        
              }
            
          } // Get with Label

        if (post_in_get)
          { // POST IN GET
            char *label = post_in_get ;
            char *body = "" ;
            int   body_len = 0 ; 
            char *c = strchr(post_in_get, ':') ;
            if (c != NULL)
              {
                *c = '\0' ;
                body = c + 1 ;
                body_len = strlen(body) ;
              }

            r = bus_forward_post(hc, label, body, body_len, NULL) ;

            if (hc->pathinfo[0] == '\0')
              { // POST IN GET without label for GET
                // Send an ' ' response
                send_mime(hc, 200, ok200title, "", "", "text/html; charset=%s", (off_t) 1, (time_t) -1) ;
                add_response_buffer( hc, " ");
              }
          }
        
        if (post_in_get == NULL && hc->pathinfo[0] == '\0')
          { // Get without Label nor embedded Submit = ERROR 403
            httpd_send_err( hc, 403, err403title, "",
                            "The Bus related URL '%.80s' is malformed.\n",
                            hc->encodedurl ) ;
            return -1 ;
          }
          
      } // METHOD GET
    else if ( hc->method == METHOD_POST)
      {
        char *form = NULL ;

        char buf[1024];
        char *postdata = (char *)0 ;
        size_t maxpostdata = 0;
        size_t postdataSize;
        ssize_t chunkSize;
        int i;
        char *body = (char *)0;
        size_t body_len = 0 ;
        char *contenttype = hc->contenttype;

        while (parameter)
          {
            if (0 == strncmp(parameter, "form=", 5))
              form = parameter + 5 ;

            parameter = strchr(parameter + 1, '&') ;
            if (parameter)
              *parameter++ = '\0' ;
          }

        postdataSize = hc->read_idx - hc->checked_idx; // may be zero

        httpd_realloc_str(&postdata, &maxpostdata, postdataSize );
        
        if ( postdataSize > 0 )
            memcpy(postdata, &(hc->read_buf[hc->checked_idx]), postdataSize) ;
        
        /* the following blockind-read loop should be logically avoided since one calls start_request after all POST DATA retrieving. */
        while ( postdataSize < hc->contentlength )
          {
            chunkSize = read( hc->conn_fd, buf, MIN( sizeof(buf), hc->contentlength - postdataSize ) );
            if ( chunkSize < 0 && ( errno == EINTR || errno == EAGAIN ) )
              {
                sleep( 1 );
                continue;
              }
            if ( chunkSize <= 0 )
              return -1;
            httpd_realloc_str(&postdata, &maxpostdata, postdataSize + chunkSize );
            memcpy(postdata + postdataSize, buf, chunkSize) ;
            postdataSize += chunkSize;
          }

        post_post_garbage_hack( hc );

        // final \0 for string search hereafter
        postdata[postdataSize] = '\0' ;

        TRACE( hc->hs->logfp, "<BUS TYPE=POST REQUEST=%.200s CONTENTTYPE=%.200s DATASIZE=%ld><EXTRACT>%.200s</EXTRACT></BUS>'", hc->pathinfo, hc->contenttype, postdataSize, postdata);


        if (!strncmp(contenttype, "multipart/", 10)) {
          char* b = strstr(contenttype, "boundary=");
          int   step = 0;
          body = postdata ;
          body_len = postdataSize ;

          if (b) {
            b+= 9;
            step++;
            {
              char* c = strstr(body, "filename=");
              if (c) {
                char* f = c + 10;
                char* fen = strstr(f, "\015\012");
                fen--;
                *fen='\0';
                fen += 3;
                step++;
                {
                  char* conte = strstr(fen, "Content-Type: ");
                  if (conte) {
                    conte += 14;
                    step++;
                    {
                      char* contend = strstr(conte, "\015\012\015\012");
                      if (contend) {
                        *contend = '\0';
                        contend += 4;
                        step++;
                        {
                          char* bodend = mymemmem(contend, body_len - (contend - body),  b, strlen(b) - 2) ;
                          if (bodend) {
                            body = contend ;
                            body_len = bodend - contend - 4;
                            contenttype = conte;
                            step++;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          TRACE( hc->hs->logfp, "multipart parsing succeed step : %d", step);
          
        } else if (!strcmp(contenttype, "application/x-www-form-urlencoded")) {
          // Forms POST
 
          if (form)
            { // url encoded data decoding adapter
              int forml = strlen(form);
              
              char *formparameter = ( *postdata != '\0' ? postdata : NULL) ;
              char *match = NULL;
              while (formparameter)
                {
                  if (!strncmp(formparameter, form, forml)
                      && formparameter[forml] == '=')
                    match = formparameter + forml + 1;
                  
                  formparameter = strchr(formparameter + 1, '&') ;
                  if (formparameter)
                    *formparameter++ = '\0' ;
                }

              if (match) {
                // annoying + to space decoding
                char *p;
                for (p = match; *p ; p++) { if (*p == '+') *p = ' '; }

                // %xx decoding
                strdecode(match, match);

                body = match;
                body_len = strlen(match);
              } else { // No matching POST parameter
             
                /* no message */
                body = NULL;
                body_len = 0;
              }
            }
          else
            { // Won't do url decoding
              /* the whole data is a message */
              body = postdata ;
              body_len = postdataSize ;
            }

        } else if (!strcmp(contenttype, "text/plain")) { // XHR
          body = postdata ;
          body_len = postdataSize ;
        } else {
          // unhandled POST MIME type (raw)
          /* the whole data is a message */
          body = postdata ;
          body_len = postdataSize ;
        }

        if (!contenttype[0]) // no contentType
          contenttype = "application/octet-stream"; // default ContentType
        
        r = bus_forward_post(hc, hc->pathinfo, body, body_len, contenttype) ;
          
        free( postdata ) ;

        // Send an empty response
        send_mime(hc, 200, ok200title, "", "", "text/html; charset=%s", (off_t) 0, (time_t) -1 );

      } // METHOD POST
    else
      { // neither GET nor POST METHOD : not supported
        httpd_send_err(hc, 501, err501title, "", "Bus request method '%.80s' not supported.\n", httpd_method_str( hc->method ) );
        return -1;
      }
    
    return 0;
    }

int proxy( httpd_conn* hc )
  {
  client_conn* cc = hc->proxy_connect ;
  size_t i;

  if (!cc)
    {
    syslog( LOG_CRIT, "proxy - the underlying client connection is missing." );
    exit( 1 );
    }

  /* request line */
  switch(hc->method)
    {
    case METHOD_GET:
      add_client_buffer(cc, "GET ");
      break;
    case METHOD_POST:
      add_client_buffer(cc, "POST ");
      break;
    case METHOD_HEAD:
      add_client_buffer(cc, "HEAD ");
      break;
    default:
      return -1;
  }
  add_client_buffer(cc, hc->proxy_remotepath);
  add_client_buffer(cc, " HTTP/1.0\015\012");

  /* copy build headers */
  add_client_buffer(cc, "Host: ") ;
  add_client_buffer(cc, hc->proxy_remotehost) ;
  add_client_buffer(cc, "\015\012");
  add_client_buffer(cc, hc->proxy_header) ;
  add_client_buffer(cc, "X-Forwarded-For: ");
  add_client_buffer(cc, httpd_ntoa( &hc->client_addr ));
  add_client_buffer(cc, "\015\012\015\012");
	
  if ( hc->method == METHOD_POST )
    {
    char *postdata = (char *)0 ;
    size_t maxpostdata = 0;
    size_t postdataSize;
    ssize_t chunkSize;
    char buf[1024];

    /* post data */
    postdataSize = hc->read_idx - hc->checked_idx ;
    if ( postdataSize > 0 )
      {
      httpd_realloc_str( &cc->buffer, &cc->maxbuffer, cc->bufferlen + postdataSize );
      (void) memcpy( &(cc->buffer[cc->bufferlen]), &(hc->read_buf[hc->checked_idx]), postdataSize );
      cc->bufferlen+= postdataSize ;
      }
	
    /* the following blocking-read loop must be avoided by retrieving the whole POST DATA before calling proxy_handle_request. */
    while ( postdataSize < hc->contentlength )
      {
      chunkSize = read( hc->conn_fd, buf, MIN( sizeof(buf), hc->contentlength - postdataSize ) );
      if ( chunkSize < 0 && ( errno == EINTR || errno == EAGAIN ) )
        {
        sleep( 1 );
        continue;
        }
      if ( chunkSize <= 0 )
        return -1;
      
      httpd_realloc_str(&cc->buffer, &cc->maxbuffer, cc->bufferlen + chunkSize );
      memcpy(&(cc->buffer[cc->bufferlen]), buf, chunkSize) ;
      cc->bufferlen += chunkSize;
      }
    
    post_post_garbage_hack( hc );
    }

  return 0;
  }


/* Generate debugging statistics syslog message. */
void handballer_logstats( httpd_server* hs, long secs ) {
  box_t* box;
  TRACE( hs->logfp, "handballer stats");
  for ( box = hs->box_list ; box != NULL ; box = box->next ) {
    TRACE( hs->logfp, "Box %p listening to '%.200s'", box, box->pattern);
  }
}
