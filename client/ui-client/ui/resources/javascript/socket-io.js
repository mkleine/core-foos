const EVENT_USER_NAME = "user_name";
const EVENT_ACTIVE_MATCH = "active_match";
const EVENT_WAITING_MATCHES = "waiting_matches";
const EVENT_START_MATCH = "start_match";
const EVENT_END_MATCH = "end_match";
const EVENT_UPDATE_STATE = "update_state";
const EVENT_INITIAL_STATE = "initial_state";

// init
const coreFoosClient = (function () {
  var url = location.href; // TODO maybe alter protocol and cut off path ?
  console.log("connecting socket to " + url);
  const webSocket =  io.connect(url);

  var connected = false;
  webSocket.on('connect', function(){
    if(connected) {
      // better reload on re-connect
      window.location.reload();
    }
    connected = true;
  });

  console.log('attaching websocket event handlers...');
  const eventSource = Object.create(null);

  [
    EVENT_USER_NAME,
    EVENT_ACTIVE_MATCH,
    EVENT_WAITING_MATCHES,
    EVENT_START_MATCH,
    EVENT_END_MATCH,
    EVENT_UPDATE_STATE,
    EVENT_INITIAL_STATE
  ].every(
          function(eventName){
            console.log("... " + eventName);
            webSocket.on(eventName, function(data){
              console.log('received msg "'+ eventName +'":' + JSON.stringify(data));
              $(eventSource).trigger(eventName,{args: data});
            });
            return true;
          }
  );

  return {
    registerMatch : function(players, callback) {
      if($.isArray(players) && players.length > 0) {
        console.log("registering match for " + JSON.stringify(players));
        webSocket.emit("register_match", players, callback);
      }
    },

    endMatch : function(matchId, callback){
      webSocket.emit("end_match", {matchId : matchId, name : model.userName}, callback);
    },

    login : function(name, pwd, callback) {
      webSocket.emit("login",{name:name,pwd:pwd}, callback);
    },

    registerHandler : function(event,handler) {
      $(eventSource).bind(event,
              function(e,data){
                handler(data.args);
              });
    }
  };
})();