const EVENT_INITIAL_STATE = "initial_state";
const EVENT_UPDATE_STATE = "update_state";

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
    EVENT_INITIAL_STATE,
    EVENT_UPDATE_STATE
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
      webSocket.emit("end_match", {_id : matchId}, callback);
    },

    cancelRequest : function(userName, callback) {
      webSocket.emit('cancel_request', userName, callback);
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