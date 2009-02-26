#ifndef HTTPBUS_AGENT
#define HTTPBUS_AGENT


#include <string>
#include "bus/getter.h"

using namespace std;

typedef bus_callback_t httpBusCB_t ;

class HttpBusAgent {

// Attributes
private:

  // HttpBus Getter
  getter_t getter ;

// Public functions
public:

	// Constructor
	HttpBusAgent();

    // sub-GET (to be called before start) : retourne true si OK
	bool get(string channelPattern, httpBusCB_t callBack, void *context);

    // GET (subscribe to the BUS) : retourne true si OK
    bool start(string superChannelPattern) ;

    // POST (publish) : retourne true si OK
	bool post(string channel, string messageBody);

	// Destructor: close running GET
	~HttpBusAgent();

};

#endif
