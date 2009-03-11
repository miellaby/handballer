// =========================================================================
// autobus
// =========================================================================

var indexAgent = new PubSubAgent();

indexAgent.cbPushList = {};
indexAgent.cbRemoveList = {};

indexAgent.push = function(name, object) {
  if (this[name] === undefined) this[name] = [];
  this[name].push(object);

  if (this.cbPushList[variable] !== undefined)
    for (var lst = this.cbPushList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, object);
}

indexAgent.remove = function(name, object) {
  if (this[name] === undefined) return;
  this[name].remove(object);

  if (this.cbRemoveList[variable] !== undefined)
    for (var lst = this.cbRemoveList[variable], l = lst.length, i = l - 1; i >= 0; i--)
      lst[i](variable, object);
}

indexAgent.getIndex = indexAgent.getfunction(name) {
  if (this[name] === undefined) this[name] = [];
  return this[name];
}

indexAgent.isIndexed = function(name, object) {
  return (this[name] && this[name].indexOf(object) != -1);
}

indexAgent.setSubscribe = function (variable, cbPush, cbRemove) {
  if (cbPush) {
     if (this.cbPushList[variable])
        this.cbPushList[variable].push(cbPush);
     else
       this.cbPushList[variable] = [cbPush];
  }

  if (cbRemove) {
     if (this.cbRemoveList[variable])
        this.cbRemoveList[variable].push(cbRemove);
     else
        this.cbRemoveList[variable] = [cbRemove];
  }
}

indexAgent.setUnsubscribe = function (variable, cbPush, cbRemove) {
  if (cbPush) this.cbPushList[variable].remove(cbPush);
  if (cbRemove) this.cbRemoveList[variable].remove(cbRemove);
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
      } else if (command == "category") {
        parameter.splice("/").forEach(function(c) { obj.
      } {
        obj.call(command, body);
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
