/** THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
** ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
** IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
** ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
** FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
** DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
** OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
** HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
** LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
** OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
** SUCH DAMAGE.
*/

#ifndef _HANDBALLER_H_
#define _HANDBALLER_H_

struct httpd_server_s;
#include "libhttpd.h"

/* Flag for bus request */
#define BUS_CONNECTION 1
#define BUS_SCRIPT_MODE 2
#define BUS_NETSCAPEPUSH_MODE 4
#define BUS_INDEXED_MODE 8
#define BUS_EVENTSTREAM_MODE 16
#define BUS_LABEL_MODE 32
#define BUS_FLUSH_MODE 64
#define BUS_ONE_SHOOT_DONE 128
#define BUS_SCRIPT_RELOAD 256
#define BUS_NULL_MODE 512
#define BUS_BOX_MODE 1024

struct s_httpd_conn;
typedef struct box_s box_t;

int box_free(struct box_s* box);
int box_unbind(struct box_s* box);

int bus( struct s_httpd_conn* hc );
int proxy( struct s_httpd_conn* hc );
int get_message_from_box( struct s_httpd_conn* hc);

/* Generate debugging statistics syslog message. */
extern void handballer_logstats( struct httpd_server_s* hs, long secs );
#endif /*  _HANDBALLER_H_ */
