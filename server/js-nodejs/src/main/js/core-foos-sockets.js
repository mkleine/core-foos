const repository = require('./lib/core-foos-repository');
repository.initialize();

const util = require('./lib/core-foos-util');
const config = util.parseConfig();
const logger = util.createLogger('### SOCKETS');

// create a socket.io http server
const webSocket = require('./lib/core-foos-http').createSocketServer();

webSocket.on('connection', function (client) {

  repository.getActiveMatch(function(match){

    repository.getWaitingMatches(function(matches){

      repository.getPendingRequests(function(users) {

        client.emit('initial_state', {
          // TODO use registration/login instead of generating new user names
          user_name : 'player-' + new Date().getTime(),
          active_match : match,
          waiting_matches : matches,
          waiting_players : users // TODO also update waiting players
        });
      });
    });
  });

  function updateState(callback, upsertMatch, removeMatch, waitingPlayers){
    const newState = {upsert : upsertMatch, remove: removeMatch, waiting_players : waitingPlayers};
    console.log('broadcasting state update: ' + JSON.stringify(newState));
    client.broadcast.emit('update_state',newState);
    callback(newState);
  }

  client.on('register_match', function (data, callback) {
    repository.requestMatch(data, function (match, waitingUsers) {
      if(match || waitingUsers) {
        logger.log("request Match produced "+JSON.stringify(match) + " / " + JSON.stringify(waitingUsers));
      }
      updateState(callback, match, null, waitingUsers);
    });
  });

  client.on('end_match', function (data, callback) {
    logger.log('receiving "end_match" for ' + JSON.stringify(data) + " with "+callback);

    repository.endMatch(data,function (finishedMatch) {
      logger.log("ended match: "+JSON.stringify(finishedMatch));

      if (finishedMatch) {
        repository.startMatch(function(startedMatch){
          logger.log("starting match: "+ JSON.stringify(startedMatch));
          updateState(callback, startedMatch, finishedMatch);
        });
      } else {
        console.log("couldn't finish match "+JSON.stringify(data));
        callback();
      }
    });
  });

  client.on('cancel_request', function(data, callback) {
    logger.log('receiving "cancel_request from ' + JSON.stringify(data) + " with " +callback);

    repository.cancelRequest(data, function(waitingUsers){
      updateState(callback, null, null, waitingUsers);
    });
  });

});