/*---------------------------------------------------------------------------
 * Project : Hanballer
 * SubProject : Hanballer Bus Client API
 * 
 */
 
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <stdio.h>
#include <string.h>
#include "_hbc.h"
#include "trace.h"

int   hbc_port     = HBC_DEFAULT_PORT ;
char *hbc_hostname = HBC_DEFAULT_HOSTNAME ;
char *hbc_prefix   = HBC_DEFAULT_PREFIX ;
static char  hbc_dynamic_hostname[PARAM_STRING_MAX_LENGTH] ;
static char  hbc_dynamic_prefix[PARAM_STRING_MAX_LENGTH] ;


static int initialized = 0 ;


void* thread_loop(void *thing) {
  fd_set rfds;
  struct s_socketTab *socketTabEntry = (struct s_socketTab *)thing ;
  char *label = NULL ;
  char *body = NULL ;
  hbc_callback_t callback = NULL ;
  void *context = NULL ;
  int iTab = 0 ;

  DBG("Bus GET thread started. ");

  callback = socketTabEntry->callback ;
  context = socketTabEntry->context ;

  for (;;){
    /* wait a message */
    if (hbc_wait(socketTabEntry->socket, &label, &body) < 0) break ;
    /* call the callback */
    callback(label, body, socketTabEntry->context) ;
  }
  close(socketTabEntry->socket);
  socketTabEntry->pid = 0 ;
  return ;
}

static int hbc_init()
{
  char *env ;

  if (initialized) return 0 ;

  /** hostname */
  struct hostent * _hbcServer = NULL;

  bzero((char *)socketTab, 5 * sizeof(struct s_socketTab)) ;

  if (hbc_hostname == NULL)
    hbc_hostname = HBC_DEFAULT_HOSTNAME ;
  if (hbc_prefix == NULL)
    hbc_prefix = HBC_DEFAULT_PREFIX ;
  if (hbc_port == 0)
    hbc_port = HBC_DEFAULT_PORT ;

  if ((env = getenv("HANDBALLER")) != NULL)
    {
      int port, nmatch = sscanf(env, "%" PARAM_STRING_MAX_LENGTH_F "[^:]:%d%" PARAM_STRING_MAX_LENGTH_F "s", hbc_dynamic_hostname, &port, hbc_dynamic_prefix) ;
      if (nmatch  < 1)
        {
          WARNING("Bad HANDBALLER value") ;
        }
      else
        {
          hbc_hostname = hbc_dynamic_hostname ;
          if (nmatch >= 2)
            {
            hbc_port = port ;

            if (nmatch == 3 && hbc_dynamic_prefix[0] == '/')
              {
                hbc_prefix = hbc_dynamic_prefix ;
              }
            }

        }          
    }

  _hbcServer = gethostbyname(hbc_hostname);
  if (_hbcServer == NULL) {
    ERROR("No such host");
    return -1;
  }
  
  bzero ((char *) &_hbcAddr, sizeof (_hbcAddr));
  _hbcAddr.sin_family = AF_INET;
  bcopy ((char *) _hbcServer->h_addr, (char *) &_hbcAddr.sin_addr.s_addr, _hbcServer->h_length);
  _hbcAddr.sin_port = htons (hbc_port);

  initialized = 1 ;
  return 0 ;
}

int hbc_get(char* pattern, hbc_callback_t callback, void* context) {
  /** Thread to wait for bus events */
  pthread_t pthread_id;
  int hbcGetSocket = 0 ; 
  int i;

  DBG("hbc_get('%s', %p, %p)", pattern, callback, context) ;

  if (hbc_init())
    return -1 ;
	
  hbcGetSocket = socket(AF_INET, SOCK_STREAM, 0);
  if (hbcGetSocket < 0)
    {
    ERROR("Bus GET: socket creation failed");
    return hbcGetSocket;
    }
  i = 0 ;
  setsockopt(hbcGetSocket, SOCK_STREAM, SO_RCVLOWAT, &i,  sizeof(int));

  if (connect(hbcGetSocket, (struct sockaddr *) &_hbcAddr, sizeof (struct sockaddr_in)) < 0)
    {
    ERROR("Bus GET: connection error");
    close(hbcGetSocket) ;
    return -1;
    }

   {
   char buffer[512] ;
   snprintf(buffer, 512, "GET %s%s?label HTTP/1.0\r\n\r\n", hbc_prefix, pattern) ;
   /* Bus messages must be managed here !*/
   DBG("Bus GET: send '%s'", buffer);
   /* send the GET HTTP request with pattern */
   if (write_now(hbcGetSocket, buffer, strlen(buffer)) <= 0)
     {
     ERROR("Bus GET: send failed");
     close(hbcGetSocket) ;
     return -1;
     }
   }
	
 for (i = 0 ; i < 5 ; i++)
   if (socketTab[i].pid == 0)
     {
     socketTab[i].socket = hbcGetSocket ;
     socketTab[i].pid = -1 ;
     socketTab[i].callback = callback ;
     socketTab[i].context = context ;
     socketTab[i].label_size = 0 ;
     socketTab[i].label = NULL ;
     socketTab[i].body_size = 0 ;
     socketTab[i].body = NULL ;
     if (!socketTab[i].read_buffer)
       {
       socketTab[i].read_buffer = malloc(READ_BUFFER_MIN_LENGTH) ;
       socketTab[i].read_buffer_size = READ_BUFFER_MIN_LENGTH ;
       }
     socketTab[i].read_offset = 0 ;
     socketTab[i].header_offset = 0 ;
     socketTab[i].labelSize_offset = 0 ;
     socketTab[i].label_offset = 0 ;
     socketTab[i].size_offset = 0 ;
     socketTab[i].body_offset = 0 ;
     socketTab[i].header_read = 0 ;
     break ;
     }

  if (i >= 5)
   {
   ERROR("Thomson like Memory full ;)") ;
   close(hbcGetSocket) ;
   return -1; 
   }


  /* check if no callback is provided */
  if (callback == NULL)
    /* return the new socket - Bus messages managed by the caller */
    return hbcGetSocket;

  // start the listening thread
  if (pthread_create(&pthread_id, NULL, thread_loop, (void *) &socketTab[i]) != 0)
    {
    ERROR("Bus GET thread creation failed");
    socketTab[i].pid = 0 ;
    return -1;
    }

  socketTab[i].pid = pthread_id ;

  return hbcGetSocket ;
}

int write_now( int fd, const void* buf, size_t nbytes ) {
  int nwritten = 0, r;
  while ( nwritten < nbytes )
    {
    r = write( fd, (char*) buf + nwritten, nbytes - nwritten );
    if ( r < 0 && ( errno == EINTR || errno == EAGAIN ) )
      {
      sleep( 1 );
      continue;
      }
    if ( r < 0 )
      return r ;

    if ( r == 0 )
      break;

    nwritten += r;
    }

  return nwritten;
}


unsigned long hbc_bodySize(int hbcGetSocket) {
  int i;
  for (i = 0 ; i < 5 ; i++)
    if (socketTab[i].pid && socketTab[i].socket == hbcGetSocket) break ;

  if (i >= 5)
    {
      ERROR("UNRECORDED CONNECTION") ;
      return 0 ;
    }

  return socketTab[i].body_size ;
}

void hbc_close(int hbcGetSocket) {
  int i = 0 ;
  close(hbcGetSocket);
  for ( ; i < 5 ; i++)
    if (socketTab[i].socket == hbcGetSocket)
      if (socketTab[i].pid == -1)
        socketTab[i].pid = 0 ;
}

int _hbc_wait(int hbcGetSocket, char **label_p, char **body_p, int headerOnly) {
  int i, n ;
  struct s_socketTab *entry = NULL ;
  char *sep ;

  for (i = 0 ; i < 5 ; i++)
    if (socketTab[i].pid && socketTab[i].socket == hbcGetSocket) break ;

  if (i >= 5)
    {
      ERROR("UNRECORDED CONNECTION") ;
      return -1 ;
    }

  entry = &socketTab[i] ;

  if (entry->body_offset > 0)
    { // last message removing
    if (entry->read_offset > entry->body_offset)
      memcpy(entry->read_buffer, entry->read_buffer + entry->body_offset, entry->read_offset - entry->body_offset) ;

    entry->read_offset -= entry->body_offset ;
    entry->read_buffer[entry->read_offset] = '\0' ; // always add a trailing /0
    entry->header_offset = 0 ;
    entry->labelSize_offset = 0 ;
    entry->label_offset = 0 ;
    entry->size_offset = 0 ;
    entry->body_offset = 0 ;
    entry->label = NULL ;
    entry->label_size = 0 ;
    entry->body = NULL ;
    entry->body_size = 0 ;
    // keeps entry->header_read to TRUE
    }

  while (1)
    {

      do
        {
          if (!entry->header_read)
            {
              sep = strstr(entry->read_buffer, "\r\n\r\n") ;
              if (!sep)
                continue ;
              sep[3] = '\0' ;
              entry->header_offset = strlen(entry->read_buffer) + 1 ;
              entry->header_read = 1 ; // remember we have read the HTTP header
              if (headerOnly) break ;
            }
          
          if (!entry->labelSize_offset)
            {
              sep = strchr(entry->read_buffer + entry->header_offset, '\n') ;
              if (!sep)
                continue ;
              *sep = '\0' ;
              sscanf(entry->read_buffer + entry->header_offset, "%x", &entry->label_size) ;
              DBG("%d bytes in label", entry->label_size) ;
              entry->labelSize_offset = entry->header_offset + strlen(entry->read_buffer + entry->header_offset) + 1 ;
            }

          if (!entry->label_offset)
            {
              if (entry->read_offset - entry->labelSize_offset < entry->label_size + 1)
                continue ;

              sep = entry->read_buffer + entry->labelSize_offset + entry->label_size ;
              *sep = '\0' ;

              entry->label = entry->read_buffer + entry->labelSize_offset ;
              entry->label_offset = entry->labelSize_offset + entry->label_size + 1 ;
            }
          
          if (!entry->size_offset)
            {
              sep = strchr(entry->read_buffer + entry->label_offset, '\n') ;
              if (!sep)
                continue ;
              *sep = '\0' ;
              sscanf(entry->read_buffer + entry->label_offset, "%x", &entry->body_size) ;
              DBG("%d bytes in body", entry->body_size) ;
              entry->size_offset = entry->label_offset + strlen(entry->read_buffer + entry->label_offset) + 1 ;
            }
          
          /* last step in automata: get body */
          
          if (entry->read_offset - entry->size_offset < entry->body_size + 1)
            continue ;
          
          entry->read_buffer[entry->size_offset + entry->body_size] = '\0' ;
          
          entry->body = entry->read_buffer + entry->size_offset ;
          entry->body_offset = entry->size_offset + entry->body_size + 1 ;
          
          break ;
        }
      while (0) ;

      
      if (entry->body || headerOnly && entry->header_read)
        // we've got a message (or the HTTP headers)
        break ;
        
      
      DBG("reading from %d",(int) entry->socket) ;
      n = recv(entry->socket, entry->read_buffer + entry->read_offset, entry->read_buffer_size - entry->read_offset - 1, 0) ;
      DBG("%d bytes read.", n) ;

      if (n <= 0)
        {
          DBG("Bus GET: connection lost") ;
          return (n < -1 ? n : -1) ;
        }
      
      if (n + entry->read_offset > (entry->read_buffer_size / 2) )
        { // large memory margin requiered
          
          char *tmp = (char *)realloc(entry->read_buffer, entry->read_buffer_size * 2) ;
          DBG("Bus GET: realloc to %d", entry->read_buffer_size * 2) ;
          if (tmp)
            {
              entry->read_buffer = tmp ;
              entry->read_buffer_size *= 2 ;
            }
          else
            {
              ERROR("Bus GET: no memory left") ;
              return -1;
            }
        }
      
      entry->read_offset += n ;
      entry->read_buffer[entry->read_offset] = '\0' ; // always add a trailing /0
      DBG("read buffer = [%s]", entry->read_buffer) ;
      
    } // while (1)

  if (label_p)
    *label_p = entry->label ;

  if (body_p)
    *body_p = entry->body ;

  return 0 ;
}

int hbc_wait(int hbcGetSocket, char **label_p, char **body_p) {
  return _hbc_wait(hbcGetSocket, label_p, body_p, 0) ;
}

int hbc_poll(int hbcGetSocket, struct timeval *timeval_p) {
  struct s_socketTab *entry = NULL ;
  int i ;

  for (i = 0 ; i < 5 ; i++)
    if (socketTab[i].pid && socketTab[i].socket == hbcGetSocket) break ;

  if (i >= 5)
    {
      ERROR("UNRECORDED CONNECTION") ;
      return -1 ;
    }

  entry = &socketTab[i] ;

  if (!entry->header_read)
    { // we first jump over the HTTP headers of a fresh GET connection (blocking)
      _hbc_wait(hbcGetSocket, NULL, NULL, 1) ;
    }

  if (entry->read_offset > entry->header_offset && entry->read_offset > entry->body_offset + 2)
    return 1 ; // Data available right now
  else
    {
      fd_set rfds;
      FD_ZERO(&rfds);
      FD_SET(hbcGetSocket, &rfds);
      return select(hbcGetSocket + 1, &rfds, NULL, NULL, timeval_p) ;
    }
}

int hbc_post(char *label, char *body) {

  int hbcPostSocket ;

  hbc_init() ;

  hbcPostSocket = socket(AF_INET, SOCK_STREAM, 0);

  if (connect(hbcPostSocket, (struct sockaddr *) &_hbcAddr, sizeof (struct sockaddr_in)) < 0)
    {
    ERROR("Bus POST: Can't connect");
    close(hbcPostSocket) ;
    return -1;
    }

  if (!body) body = "" ;

  {
    char buffer[255] ;
    snprintf(buffer, 255, "POST %s%s HTTP/1.0\r\nContent-Length: %d\r\n\r\n", hbc_prefix, label, strlen(body)) ;
    /* Bus messages must be managed here !*/
    DBG("Bus POST: send '%s'", buffer);
    /* send the GET HTTP request with label */
    if (write_now(hbcPostSocket, buffer, strlen(buffer)) <= 0)
      {
      ERROR("Bus POST: send header failed.");
      close(hbcPostSocket) ;
      return -1;
      }
  }

  DBG("Bus POST: send '%s'", body);
  if (write_now(hbcPostSocket, body, strlen(body)) <= 0)
    {
    ERROR("Bus Post: send body failed.");
    close(hbcPostSocket) ;
    return -1;
    }

  close(hbcPostSocket) ;

  return 0;
}
