// =========================================================================
//
// imAgent : Instant Messaging Agent
//
// =========================================================================
var imAgent = new BusState() ;

// private variables
// =========================================================================
imAgent._counters = {} ; // last retrieved counters. usefull when identity change.

// public & subscribable variables
// =========================================================================
imAgent.poolingInterval = null ; // non null says pooling is active
imAgent.timestamp = 0 ; // change means a pool is occurring (counters are not yet set though)
imAgent.identity = undefined ;
// counters for known types of messages
imAgent.mail = 0 ;
imAgent.vocal = 0 ;



// specific methods
// =========================================================================
imAgent.trace = function(msg) {_busSend("log/www-browser", msg) ; } ;

imAgent.recParseNotif = function(responseXMLNode, username, type) {
  var i, l = responseXMLNode.childNodes.length ;
  for (i = 0 ; i < l ;  i++)
    {
      var c = responseXMLNode.childNodes[i] ;
      if (c.nodeType != Node.ELEMENT_NODE)
        continue ;

      var name = c.nodeName.toLowerCase() ;
      if (name == "count")
        {
          if (type == "vocal")
            imAgent.set(type, c.firstChild.nodeValue) ;
          else if (username !== undefined && type !== undefined)
            {
              if (imAgent._counters[username] === undefined)
                imAgent._counters[username] = {} ;
              
              if (imAgent._counters[username][type] !== undefined)
                imAgent._counters[username][type] += parseInt(c.firstChild.nodeValue) ;
              else
                imAgent._counters[username][type] = parseInt(c.firstChild.nodeValue) ;
              
              if (imAgent.get("identity") == username)
                imAgent.set(type, c.firstChild.nodeValue) ;
            }
        }
      else
        {
          if (name == "displayname")
            {
              username = c.firstChild.nodeValue ;
              // imAgent.trace(username) ;
            }
          else if (name == "type")
            type = c.firstChild.nodeValue.toLowerCase() ;
          else if (name == "timestamp")
            imAgent.set("timestamp", c.firstChild.nodeValue) ;
          
          imAgent.recParseNotif(c, username, type) ;
        }
    }
}

// to parse any DOM object
imAgent.parseNotif = function(responseXML) {
  imAgent._counters = {} ; // reset last retrieved counters
  imAgent.set("vocal", "0") ;
  imAgent.set("email", "0") ;
  imAgent.recParseNotif(responseXML, null, null) ;
}
    
// to pool the platform right now
var imAgentXHR ;
imAgent.poolNow = function() {
  imAgentXHR = new XMLHttpRequest() ;
  imAgentXHR.open('GET', "/notif/?last_access=" + imAgent.get("timestamp"), true);
  imAgentXHR.onreadystatechange = function(e) {           
    if (imAgentXHR.readyState == 4)
      {
        if (imAgentXHR.status == 200)
          imAgent.parseNotif(imAgentXHR.responseXML) ;
        imAgentXHR.onreadystatechange = null ;
      }
  } ;
  imAgentXHR.send(null);
} ;

// to enable/disable the pooling loop (based on setInterval)
imAgent.enable = function(bool) {
  if (bool && imAgent.poolingInterval == null)
    {
      imAgent.poolNow() ; // pool right now (to be discussed)
      imAgent.poolingInterval = setInterval(imAgent.poolNow, 10 * 60000) ;
    }

  if (!bool && imAgent.poolingInterval != null)
    {
      clearInterval(imAgent.poolingInterval) ;
      imAgent.poolingInterval = null ;
    }
}

// to change current user identity
imAgent.setIdentity = function(identity) { 
  imAgent.set("identity", identity) ;
  // the attached actions are attached through a longSubscribe hereafter
  // (to avoid triggering when old and new identity are the same)
}

// to acknowlege a typed positive counter
imAgent.acknowledge = function(type) {
  var identity = imAgent.get("identity") ;
  imAgent.set(type, "0") ;
  
  // reset corresponding counter in last retrieved result
  if (type != "vocal" && identity !== undefined && imAgent._counters[identity] !== undefined)
    imAgent._counters[identity][type] = "0" ;
}

_onIdentityChangeCB = function(name, identity) {
  // reset current counters to new identity
  // imAgent.trace(identity) ;
  var counters = imAgent._counters[identity] ;
  if (counters)
    for (type in counters)
      {
        imAgent.set(type, "0") ; // to be sure the BusState event will be fired if counter > 0
        imAgent.set_and_fire(type, counters[type]) ;
      }
}

imAgent.longSubscribe("identity", _onIdentityChangeCB) ;
