const http = require('http');
const socketIO = require('socket.io');
const static = require('node-static');
const repository = require('./core-foos-server');
const util = require('./lib/core-foos-util');
const config = util.parseConfig();
var logger = util.createLogger('core-foos-socket');

var clientFiles = new static.Server(config.dir ? config.dir : './client');
repository.initialize();

logger.log("Ready to listen");

var httpServer = http.createServer(function (request, response) {
  logger.log('handling http request '+request.toString());
  request.addListener('end', function () {
    clientFiles.serve(request, response);
  });
});
httpServer.listen(config.port ? config.port : 2000);

var webSocket = socketIO.listen(httpServer);
if(config.deployment == "heroku") {
  webSocket.configure(function () {
    // taken from https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
    webSocket.set("transports", ["xhr-polling"]);
    webSocket.set("polling duration", 10);
  });
}

webSocket.on('connection', function (client) {

  repository.getActiveMatch(function(match){

    repository.getWaitingMatches(function(matches){

      repository.getListOfUsers(function(users) {

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

  function updateState(callback, upsertMatch, removeMatch){
    const newState = {upsert : upsertMatch, remove: removeMatch};
    console.log('broadcasting state update: ' + JSON.stringify(newState));
    client.broadcast.emit('update_state',newState);
    callback(newState);
  }

  client.on('register_match', function (data, callback) {
    repository.requestMatch(data, function (match) {
      if (match) {
        logger.log("starting new match: "+JSON.stringify(match));
      }
      updateState(callback,match);
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

});