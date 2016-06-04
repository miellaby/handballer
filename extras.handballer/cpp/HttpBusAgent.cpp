
#include "../include/HttpBusState.h"
#include <dbg_macro.h>

HttpBusState::HttpBusState() {
  getter = getter_new() ;
}

bool HttpBusState::start(string superChannelPattern) {
  return (getter_start(getter, (char *)superChannelPattern.c_str()) == 0) ;
}

bool HttpBusState::get(string channelPattern, HttpBusCB_t callBack, void *context) {
  return (getter_get(getter, (char *)channelPattern.c_str(), callBack, (char *)context) == 0) ;
}

bool HttpBusState::post(string channel, string messageBody) {
  return (bus_post((char *)channel.c_str(), (char *)messageBody.c_str()) == 0) ;
}

HttpBusState::~HttpBusState() {
  getter_stop(getter) ;
  free(getter) ;
}
