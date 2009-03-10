// =========================================================================
// autobus
// =========================================================================

var indexAgent = new busAgent();

indexAgent.index = function(name, object) {
  if (this[name] === undefined) this[name] = [];
  this[name].push(object);
}

indexAgent.getIndex = function(name) {
  if (this[name] === undefined) this[name] = [];
  return this[name];
}

indexAgent.isIndexed = function(name, object) {
  return (this[name] && this[name].indexOf(object) != -1);
}

// ======

function autobusMessageCB(label, body) {
  var obj = null ;
  var variable = null ;
  var command = null ;
  var id = null ;
  if (label.substring(0,8)== "control/")
    {
      var slashIdx = label.indexOf("/",8);
      var slash2Idx = label.indexOf("/",slashIdx+1);
      var agentType = label.substring(9, slashIdx);
      var agentName = slash2Idx == -1 ? undefined : label.substring(slashIdx + 1, slash2Idx);
      var command = slash2Idx == -1 ? label.substring(slashIdx + 1) : label.substring(slash2Idx + 1);
      var parameter = null;
      if (command.indexOf("/")!=-1) {
        parameter = command.substr(1 + command.indexOf("/"));
        command = command.substr(0, command.indexOf("/"));
      }

      if (agentName === undefined) {
        obj = indexAgent.getIndex(agentType);
      } else {
        obj = indexAgent.getIndex(agentName);
      }
      if (command == "set") {
        obj.set(parameter, body);
      } else {
        obj[command].call([parameter, body], obj);
      }
    } else if (label.substring(0,6) == "model/") {

      var slashIdx = label.indexOf("/",6);
      var slash2Idx = label.indexOf("/",slashIdx+1);
      var agentType = label.substring(6, slashIdx);
      var agentName = slash2Idx == -1 ? undefined : label.substring(slashIdx + 1, slash2Idx);
      var slot = slash2Idx == -1 ? label.substring(slashIdx + 1) : label.substring(slash2Idx + 1);
      
      obj.setted(slot, body) ;
    }
}


# to activate autobus layer:
# hbc.init("/bus/", "**", autobusMessageCB) ;
