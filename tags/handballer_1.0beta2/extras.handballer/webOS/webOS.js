// webOS.js
// Brower and Lower Layers linking via handballer

// =========================================================================
//
// BusAgent : Bus Agent prototype
//
// =========================================================================

var busAgents = [] ;

function BusAgent() {
  this.cbList = {} ;
  this.cbListLong = {}
  busAgents.push(this) ;
} ;

BusAgent.prototype.subscribe = function (variable, cb) {
  if (this.cbList[variable])
    this.cbList[variable].push(cb) ;
  else
    this.cbList[variable] = [cb] ;
}

BusAgent.prototype.longSubscribe = function (variable, cb) {
  if (this.cbListLong[variable])
    this.cbListLong[variable].push(cb) ;
  else
    this.cbListLong[variable] = [cb] ;
}

BusAgent.prototype.longUnsubscribe = function(variable, cb) {
  var newList = [] ;
  var oldList = this.cbListLong[variable] ;
  if (oldList)
    {
    acb = oldList.pop(cb) ;
    while (acb)
      {
      if (acb != cb)
          newList.push(acb) ;
      acb = oldList.pop(cb) ;
      }
    }
  this.cbListLong[variable] = newList ;      
}

BusAgent.prototype.set_and_fire = function(variable, value) {
  this[variable] = value ;

  if (this.cbList[variable])
    for (var lst = this.cbList[variable], l = lst.length, i = l - 1 ; i >= 0 ; i--)
      lst[i](variable, value) ;

  if (this.cbListLong[variable])
    for (var lst = this.cbListLong[variable], l = lst.length, i = l - 1 ; i >= 0 ; i--)
      lst[i](variable, value) ;
}

BusAgent.prototype.get = function(variable) { return this[variable] ; }
BusAgent.prototype.getOr = function(variable, defaultValue) { return (this[variable] == undefined ? defaultValue : this[variable]) ; }

BusAgent.prototype.setted = function(variable, newValue) {
  var currentValue = (this[variable] != undefined ? this[variable] : null) ; 
  if (newValue != currentValue)
    this.set_and_fire(variable, newValue) ;
}

BusAgent.prototype.set = BusAgent.prototype.setted ;

BusAgent.prototype.status = function() {
  var status = new Object() ;
  for (p in this)
    if (p != "cbList" && p != "cbListLong")
       status[p] = this[p] ;
  return status ;
}

// =========================================================================
//
// memAgent : Parameters storage agent
//
// =========================================================================

var memAgent = new BusAgent() ;
memAgent.slideshow = "false" ;
memAgent.defaultslideshowcontainerid = "" ;
memAgent.slideshowcontainerid = "" ;

// =========================================================================
//
// systemAgent : System control agent
//
// =========================================================================


var systemAgent = new BusAgent() ;

systemAgent.set = function (key,value) {
   _busSend("control/system/set/" + key, value);
}

systemAgent.addBrightness = function (value) {
   _busSend("control/system/add/brightness", value);
}

systemAgent.connect = function () {
   _busSend("control/system/connect");
}

systemAgent.checkUpgradeEligibity = function () {
  if (systemAgent.get("networkstatus") == "on-line")
    _busSend("control/system/checkupgrade");
}

systemAgent.upgrade = function () {
  _busSend("control/system/upgrade");
}

// Some safe default values
systemAgent.inactivityperiod = "900000" ;
systemAgent.photoframeperiod = "900000" ;
systemAgent.idle = "false" ;
systemAgent.powermode = "unplugged" ;
systemAgent.upgradable = "false" ;

// =========================================================================
//
// browserAgent : File and neighbour agents browsing
//
// =========================================================================

browserAgent = new BusAgent() ;
browserAgent.AVSinksContainerId = "sinks";
browserAgent.AVSourcesContainerId = "sources";

browserAgent.browseOrSearchOrPush = function(action, containerId, firstIndex, length, sort, filter, fields) {
  browserAgentResult = {} ;
  var sortURI = '' ;
  var filterURI = '' ;
  var fieldsURI = '' ;

  if (firstIndex == null) firstIndex = 0 ;
  if (length == null) length = -1 ;
  if (sort != null) {
    for (var lst = sort, l = lst.length, i = l - 1 ; i >= 0 ; i--)
      sortURI = sortURI + "+" + encodeURIComponent(lst[i]) ;
    sortURI = sortURI.substring(1) ;
  }
  if (filter != null) {
    for (c in filter)
      filterURI = filterURI + "+" + encodeURIComponent(c) + '+' + encodeURIComponent(filter[c]) ;
    filterURI = filterURI.substring(1) ;
  }
  if (fields != null) {
    for (var lst = fields, l = lst.length, i = l - 1 ; i >= 0 ; i--)
      fieldsURI = fieldsURI + "+" + encodeURIComponent(lst[i]) ;
    fieldsURI = fielsURI.substring(1) ;
  }

  var channel = (action.indexOf("/pushcontainer") != -1 ? "control/playlist/" + action : "control/browser/" + action) ;
  _busSend(channel, "id=" + encodeURIComponent(containerId) + "&first="+firstIndex+"&length="+length+"&sort="+sortURI+"&filter="+filterURI+"&fields="+fieldsURI, false) ;
}

browserAgent.browse = function(containerId, firstIndex, length, sort, filter, fields) {
  browserAgent.browseOrSearchOrPush("browse", containerId, firstIndex, length, sort, filter, fields) ;
}

browserAgent.search = function(containerId, firstIndex, length, sort, filter, fields) {
  browserAgent.browseOrSearchOrPush("search", containerId, firstIndex, length, sort, filter, fields) ;
}

browserAgent.jump = function(delta) {
  _busSend("control/browser/jump", delta) ;
}

browserAgent.browseItem = function(id, fields) {
  var fieldsURI = "" ;
  if (fields != null) {

    for (var lst = fields, l = lst.length, i = l - 1 ; i >= 0 ; i--)
      fieldsURI = fieldsURI + "+" + encodeURIComponent(lst[i]) ;

    fieldsURI = fielsURI.substring(1) ;
  }

  _busSend("control/browser/browseItem=", "id=" + encodeURIComponent(id) + "&fields="+fieldsURI, false) ;
}

// =========================================================================
// mediaPlayerAgent : set of multimedia players control
// =========================================================================

var screenPlayerId = "screen" ;

var mediaPlayerAgent = {
  players: {},
  currentplayer: null
 } ;

function _cleanPlayerInstance() { // clean any non-fundamental vars
  var fundamentalVars = { cbList: true, cbListLong: true, mute: true, volume: true, position: true, state: true, url: true} ;
  for (key in this)
    if (typeof this[key] != 'function' && !fundamentalVars[key])
      this.setted(key, undefined) ;
}

mediaPlayerAgent.getPlayer = function(playerId) {
  var player = this.players[playerId] ;
  if (!player)
     { // player pas connu (player UPNP renvoyé par browse() mais pas actif), on le créée
       var player = new BusAgent() ;
       this.players[playerId] = player ;
       player.playerid = playerId ;

       player.open = function (url) { _busSend("control/player/" + playerId + "/open", url); } ;
       player.close = function () { _busSend("control/player/" + playerId + "/close") } ;
       player.play = function () { _busSend("control/player/" + playerId + "/play") ; } ;
       // player.stop = function () { _busSend("control/player/" + playerId + "/stop") } ;
       player.pause = function () { _busSend("control/player/" + playerId + "/pause") ; } ;
       player.jump = function (delta) { _busSend("control/player/" + playerId + "/jump", delta) ; } ;
       player.seek = function (position) { _busSend("control/player/" + playerId + "/seek", position) ; } ;
       player.setVolume = function(value) { _busSend("control/player/" + playerId + "/set/volume", value) ; };
       player.addVolume = function(delta) { _busSend("control/player/" + playerId + "/add/volume", delta) ; };
       player.setMute = function(bool) { _busSend("control/player/" + playerId + "/set/mute", bool ? "true" : "false") ; };
       player.swapMute = function() { _busSend("control/player/" + playerId + "/swap/mute") ; };
       // Cette fonction sert à nettoyer toutes les variables de méta-données
       player.state = "undefined" ;
     }
  return player ;
}

screenPlayer = mediaPlayerAgent.getPlayer(screenPlayerId) ;
mediaPlayerAgent.currentplayer = screenPlayer ;

mediaPlayerAgent.init = function(playerId, url) {
  if (!playerId)
    playerId = screenPlayerId ;

  mediaPlayerAgent.currentplayer = mediaPlayerAgent.getPlayer(playerId) ;

  if (url) mediaPlayerAgent.open(url) ;
}

mediaPlayerAgent.open = function(url) { this.currentplayer.open(url); }
mediaPlayerAgent.play= function() { this.currentplayer.play(); }
mediaPlayerAgent.pause = function() { this.currentplayer.pause(); }
mediaPlayerAgent.jump = function(delta) { this.currentplayer.jump(delta); }
mediaPlayerAgent.seek = function(position) { this.currentplayer.seek(position); }
mediaPlayerAgent.close = function() { this.currentplayer.close(); }
mediaPlayerAgent.status = function() { return (this.currentplayer ? this.currentplayer.status() : {} ) } ;
mediaPlayerAgent.setVolume = function(value) { this.currentplayer.setVolume(value); }
mediaPlayerAgent.addVolume = function(delta) { this.currentplayer.addVolume(delta); }
mediaPlayerAgent.setMute = function(bool) { this.currentplayer.setMute(bool); }
mediaPlayerAgent.swapMute = function() { this.currentplayer.swapMute(); }
mediaPlayerAgent.get = function(key) { return this.currentplayer.get(key) ; }
mediaPlayerAgent.subscribe = function(key, callback) { return this.currentplayer.subscribe(key, callback) ; }

// =========================================================================
//
// playlistsAgent : playlistManager
//
// =========================================================================

var mainPlaylistId = "mainplayer" ;
var miniPlaylistId = "miniplayer" ;

var playlistAgent = {
  playlists: {},
  currentplaylist: null
} ;

function _cleanPlaylistInstance() { // clean any non-fundamental vars
  var fundamentalVars = { cbList: true, cbListLong: true, size: true, url: true, automatic: true, repeatmode: true, type: true, frameperiod: true} ;
  for (key in this)
    if (typeof this[key] != 'function' && !fundamentalVars[key])
      this.setted(key, undefined) ;
}

playlistAgent.getPlaylist = function(playlistId) {
  if (!playlistId)
    return null ;

  var playlist = this.playlists[playlistId] ;
  if (!playlist)
    {
      playlist = new BusAgent() ;

      playlist.player = mediaPlayerAgent.getPlayer(playlistId == miniPlaylistId || playlistId == mainPlaylistId ? "screen" : playlistId)  ;
      playlist.clean = function(type) { _busSend("control/playlist/" + playlistId + "/clean", type) ; } ;
      playlist.push = function(url) { _busSend("control/playlist/" + playlistId + "/push", url) ; } ;
      playlist.pushContainer = function(containerId, firstIndex, length, sort, filter, fields) {
        browserAgent.browseOrSearchOrPush(playlistId + "/pushcontainer", containerId, firstIndex, length, sort, filter, fields) ;
      } ;
      playlist.pushSet = function(urls) { _busSend("control/playlist/" + playlistId + "/pushset", urls.join('\r')) ; } ;
      playlist.setMetadata = function(url,variable,value) { _busSend("control/playlist/" + playlistId + "/metadata", url + '\r' + variable + '=' + value) ; } ;

      playlist.seek = function(position) { _busSend("control/playlist/" + playlistId + "/seek", position) ; } ;
      playlist.search = function(url) { _busSend("control/playlist/" + playlistId + "/search", url) ; } ;
      playlist.jump = function(delta) { _busSend("control/playlist/" + playlistId + "/jump", delta) ; } ;
      playlist.setAutomatic = function(bool) { _busSend("control/playlist/" + playlistId + "/automatic", bool ? "true" : "false") ; } ;
      playlist.setFramePeriod = function(period) { _busSend("control/playlist/" + playlistId + "/frameperiod", period) ; } ;
      playlist.setRepeatMode = function(mode) { _busSend("control/playlist/" + playlistId + "/repeatmode", mode) ; } ;
      playlist.length = "0" ;
      playlist.position = "-1" ;

      this.playlists[playlistId] = playlist ;
    }
  
  return playlist ;
}

playlistAgent.setCurrentPlaylist = function () {
  return (this.currentplaylist = this.getPlaylist(mediaPlayerAgent.currentplayer.playerid)) ;
}

playlistAgent.clean = function() { this.setCurrentPlaylist().clean() ; }
playlistAgent.push = function(url) { this.setCurrentPlaylist().push(url) ; }
playlistAgent.seek = function(position) { this.setCurrentPlaylist().seek(position) ; }
playlistAgent.jump = function(delta) { this.setCurrentPlaylist().jump(delta) ; }
playlistAgent.setAutomatic = function(bool) { this.setCurrentPlaylist().setAutomatic(bool) ; }
playlistAgent.setFramePeriod = function(period) { this.setCurrentPlaylist().setFramePeriod(period) ; }
playlistAgent.setRepeatMode = function(mode) { this.setCurrentPlaylist().setRepeatMode(mode) ; }
playlistAgent.status = function() { return this.setCurrentPlaylist().status() ; }
playlistAgent.get = function(key) { return this.setCurrentPlaylist().get(key) ; }
playlistAgent.set = function(key, value) { this.setCurrentPlaylist().set(key, value) ; }
playlistAgent.subscribe = function(key, callback) { this.setCurrentPlaylist().subscribe(key, callback) ; }

// =========================================================================
//
// shareAgent : resource sharing management
//
// =========================================================================

var shareAgent = new BusAgent() ;

shareAgent["audio"] = "local" ;
shareAgent["fullscreen"] = "local" ;
shareAgent["eventgui"] = "local" ;
shareAgent["idlegui"] = "local" ;
shareAgent["controlgui"] = "local" ;

shareAgent.request = function(rsc) {
  this.set(rsc, "service") ;
}
// renaming...
shareAgent.getOwner = shareAgent.get ;
shareAgent.get = shareAgent.request ;

// =========================================================================
//
// imAgent : Instant Messaging Agent
//
// =========================================================================
// var imAgent = new BusAgent() ;
// imAgent.setIdentity = function(userName) { _busSend("control/messaging/set/identity", userName) ; } ;

// =========================================================================
//
// XSS Call default handler (overwrite it in an upper JS layer!)
//
// =========================================================================
function busXSS(command, params) {
  _busSend("log/www-browser", "No XSS call handler") ;
}

// =========================================================================
//
// Connection JavaScript / BUS HTTP
//
// =========================================================================

var _busSendXhr = new XMLHttpRequest() ;
var _busSendFifo = [] ;
var _busSending = false ;
function _busSendOne(channel, msg) {
  _busSending=true ;
  //_busSendXhr = new XMLHttpRequest() ;
  _busSendXhr.open("POST", "/bus/" + channel, true) ;
  _busSendXhr.onreadystatechange = function() { if (_busSendXhr.readyState >= 3) { _busSending=false;_busSendNext(); } } ;
  _busSendXhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
  _busSendXhr.send(msg == null ? "" : "" + msg);
  //_busSendXhr.abort();
}
function _busSendNext() {
  if (_busSending) return ;
  var next = _busSendFifo.shift() ;
  if (next)
     _busSendOne(next[0], next[1]);
}

function _busSend(channel, msg) {
  _busSendFifo.push([channel, msg]) ;
  _busSendNext() ;
}


function _busReceive(channel, msg) {

  // document.getElementById('trace').innerHTML = channel + " : " + msg ;

  var obj = null ;
  var variable = null ;
  var command = null ;
  var id = null ;
  if (channel.substring(0,20)== "control/www-browser/")
    {
      var command = channel.substring(20) ;
      if (command == "key")
        {
          memAgent.key = undefined ; // force callback reruning for same key
          obj = memAgent ;
          variable = command ;
        }
      else if (command == "imageurl")
        {
          obj = memAgent ;
          variable = command ;
        }
      else if (command == "refresh")
        {
          setTimeout(function() {window.location.reload() ; }, parseInt(msg == "" ? "0" : msg)) ;
        }
      else if (command.substring(0,4) == "xss/")
        {
          var params = [] ;
          function pushParam(s,param) { params.push(decodeURIComponent(param)) ; } ;
          msg.replace(/([^|]*)\|/g,pushParam) ;

          busXSS(command.substring(4), params) ;
        }
    }
  else if (channel.substring(0,13)== "model/system/")
    {
      obj = systemAgent ;
      variable = channel.substring(13) ;
    }
  else if (channel.substring(0,14)== "model/browser/")
    {
      obj = browserAgent ;
      variable = channel.substring(14) ;
      if (variable == "view")
        obj["view"] = null ;
    }
  else if (channel.substring(0,16)== "model/messaging/")
    {
      obj = imAgent ;
      variable = channel.substring(16) ;
    }
  else if (channel.substring(0,20)== "model/player/screen/")
    {
      obj = screenPlayer ;
      variable = channel.substring(20) ;

      if (variable == "url")
        _cleanPlayerInstance.call(obj) ;
    }
  else if (channel.substring(0,13)== "model/player/")
    {
      var udn_and_variable = channel.substring(13) ;
      id = udn_and_variable.substring(0, udn_and_variable.indexOf("/")) ;
      variable = udn_and_variable.substring(1 + udn_and_variable.indexOf("/")) ;
      obj = mediaPlayerAgent.getPlayer(id) ;
      
      if (variable == "url")
        _cleanPlayerInstance.call(obj) ;
    }
  else if (channel.substring(0,15)== "model/playlist/")
    {
      var udn_and_variable = channel.substring(15) ;
      id = udn_and_variable.substring(0, udn_and_variable.indexOf("/")) ;
      variable = udn_and_variable.substring(1 + udn_and_variable.indexOf("/")) ;
      obj = playlistAgent.getPlaylist(id) ;

      if (variable == "position")
        _cleanPlaylistInstance.call(obj) ;
    }

  // Length and position workaround for hh:mm:ss format to be translated in ms
  if ((variable == "length" || variable == "position") && msg.indexOf(":") != -1) {
    msg.replace(/^([^:]+):([^:]+):([^:])/, function (d, h, m, s) { msg = "" + ((parseInt(h) * 60 + parseInt(m)) * 60 + parseInt(s))}) ;
  }

  if (obj)
      obj.setted(variable, msg) ;

}


function _onPageUnload() {
  for (rsc in shareAgent)
    if (shareAgent[rsc] == "service")
      shareAgent.setted(rsc, "local") ;

  for (var lst = busAgents, l = lst.length, i = l - 1 ; i >= 0 ; i--)
    lst[i].cbList = {} ;
  
  mediaPlayerAgent.currentplayer = screenPlayer ;
}

function _blankingPauseRenewal() {
  _busSend("control/system/blankingpause") ;
}


var _dontBlankInterval = null ;
function blankingPauseEnable(bool) {
  if (bool)
    {

      if (!_dontBlankInterval)
        {
          _blankingPauseRenewal() ;
          _dontBlankInterval = setInterval(_blankingPauseRenewal, 40000) ;
        }
    }
  else
    {
      if (_dontBlankInterval)
        {
          clearInterval(_dontBlankInterval) ;
          _dontBlankInterval = null ;
        }
    }
}

// deprecated :
// document.write("<iframe id='iframeNotif' name='iframeNotif' src='' style='visibility:hidden;width:0px;height:0px;'></iframe>") ;

var busReceiveXHR ;
var lastXHRstate = -1 ;
function busInit()
{
  busReceiveXHR = new XMLHttpRequest();
  if (busReceiveXHR.multipart !== undefined)
    { // mozilla
      busReceiveXHR.multipart = true;       
      busReceiveXHR.onload = function(e) {           
        var i = busReceiveXHR.responseText.indexOf("\n") ;
        var channel = busReceiveXHR.responseText.substring(0, i) ;
        var message = busReceiveXHR.responseText.substring(i + 1) ;
        _busReceive(channel, message) ;
      } ;

      busReceiveXHR.open('GET', "/bus/control/www-browser/**|model/**?channel&push=XXX", true);       
      busReceiveXHR.send(null);    
    }
  else
    { // others

      var currentIdx = 0 ;

      var pollget = function() {
        if (busReceiveXHR.readyState >= 3)
          {
            var nextSizeIdx = busReceiveXHR.responseText.indexOf("\n", currentIdx) ;
            var nextBodyIdx = (nextSizeIdx > 0 ? busReceiveXHR.responseText.indexOf("\n", nextSizeIdx + 1) : -1) ;
            while (nextBodyIdx != -1)
              {
                var channel = busReceiveXHR.responseText.substring(currentIdx, nextSizeIdx) ;
                nextSizeIdx++ ;
                nextBodyIdx++ ;
                var bodySize = parseInt(busReceiveXHR.responseText.substring(nextSizeIdx, nextBodyIdx)) ;
                if (nextBodyIdx + bodySize >= busReceiveXHR.responseText.length) break ;
                var body = busReceiveXHR.responseText.substr(nextBodyIdx, bodySize) ;
                try {
                  _busReceive(channel, body) ;
                } catch (e) {
                  _busSend("log/www-browser", e.message + " [" + e.name + "]") ;
                }
                currentIdx = nextBodyIdx + bodySize + 1 ;
                nextSizeIdx = busReceiveXHR.responseText.indexOf("\n", currentIdx) ;
                nextBodyIdx = (nextSizeIdx > 0 ? busReceiveXHR.responseText.indexOf("\n", nextSizeIdx + 1) : -1) ;
              }
          }
        if (busReceiveXHR.readyState < 4)
          setTimeout(pollget, 200) ;
      } ;

      busReceiveXHR.open('GET', "/bus/control/www-browser/**|model/**?channel" + "&timestamp=" + Number(new Date()), true);       
      busReceiveXHR.send(null);

      setTimeout(pollget, 200) ;
    }

  busReceiveXHR.onreadystatechange = function() {           
    if (busReceiveXHR.readyState==4 && lastXHRstate==1)
      { // if connexion is stopped, let's relaunch it after a while and re-synchronize things
        busReceiveXHR.onreadystatechange = null ;
        busReceiveXHR.abort();
        setTimeout(busInit, 3000) ;
      }
    lastXHRstate = busReceiveXHR.readyState ;
  } ;
  

  // deprecated :
  // document.getElementById('iframeNotif').src = "/bus/control/www-browser/**|model/**?channel&script=window.parent._busReceive" ;
 
  //
  // synchronize JS with out-browser agents
  //
  _busSend("control/all/status") ;
}

// =========================================================================
//
// helpers
//
// =========================================================================

// helper : return true is the player is free for a new playlist
function player_is_free(playerId, mediaType) {
  var playlistId = (playerId == "screen" ? ( mediaType == "audio" ? miniPlaylistId : mainPlaylistId ) : playerId) ;
  return (-1 == parseInt(playlistAgent.getPlaylist(playlistId).get("position"))) ;
}
