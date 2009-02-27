
#include "../include/HttpBusAgent.h"
#include <dbg_macro.h>

HttpBusAgent::HttpBusAgent() {
  getter = getter_new() ;
}

bool HttpBusAgent::start(string superChannelPattern) {
  return (getter_start(getter, (char *)superChannelPattern.c_str()) == 0) ;
}

bool HttpBusAgent::get(string channelPattern, HttpBusCB_t callBack, void *context) {
  return (getter_get(getter, (char *)channelPattern.c_str(), callBack, (char *)context) == 0) ;
}

bool HttpBusAgent::post(string channel, string messageBody) {
  return (bus_post((char *)channel.c_str(), (char *)messageBody.c_str()) == 0) ;
}

HttpBusAgent::~HttpBusAgent() {
  getter_stop(getter) ;
  free(getter) ;
}
