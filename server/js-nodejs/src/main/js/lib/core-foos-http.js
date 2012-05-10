const http = require('http');
const url = require('url');
const socketIO = require('socket.io');
const nodeStatic = require('node-static');
const repository = require('./core-foos-repository');
const util = require('./core-foos-util');
const config = util.parseConfig();
var logger = util.createLogger('### HTTP');

const clientFiles = new nodeStatic.Server(config.dir ? config.dir : './client');

const COOKIE_USER_NAME = 'core_foos_user_name';

function getCookies(request) {
  const cookies = Object.create(null);
  request.headers.cookie && request.headers.cookie.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
  });
  return cookies;
}

function setCookie(response, name, value, secondsToLive) {
  const object = {
    'Set-Cookie': name + "="+value,
    'Content-Type': 'text/plain'
  };
  if(millisToLive){
    object['Max-Age'] = secondsToLive;
  }
  response.writeHead(200, object);
}

function determineUserName(request,response) {
  const cookies = getCookies(request);
  var userName = cookies[COOKIE_USER_NAME];
  if(!userName){
    userName = "quick-match";
  }
  return userName;
}

function serveQuickHandles(webSocket, request, response){

  function broadcastStateUpdate(upsertMatch, removeMatch, waitingPlayers) {
    const newState = {upsert:upsertMatch, remove:removeMatch, waiting_players:waitingPlayers};
    logger.log('broadcasting state update: ' + JSON.stringify(newState));

    webSocket.sockets.emit('update_state', newState);
  }

  const parsedURL = url.parse(request.url, true);
  const playerName = determineUserName(request, response);

  if(parsedURL.pathname == '/quickmatch') {
    logger.log("handling quickmatch request: "+ JSON.stringify(parsedURL) + " (user: "+playerName+")");
    repository.requestImmediateMatch(playerName, broadcastStateUpdate);
    return true;

  } else if(parsedURL.pathname == '/endactivematch'){
    logger.log("handling quickmatch request: "+ JSON.stringify(parsedURL) + " (user: "+playerName+")");
    repository.getActiveMatch(function(activeMatch){
      if(activeMatch) {
        repository.endMatch({matchId : activeMatch._id}, function(finishedMatch){

          if (finishedMatch) {
            repository.startMatch(function(startedMatch){
              logger.log("starting match: "+ JSON.stringify(startedMatch));
              broadcastStateUpdate(startedMatch, finishedMatch);
            });
          }

        });
      }
    });
    return true;
  }
  return false;
}

module.exports = {
  createSocketServer : function(){

    const httpServer = http.createServer(function (request, response) {
      if(serveQuickHandles(webSocket, request, response)) {
        // serve something useful
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('okay');
      } else {
        request.addListener('end', function () {
          clientFiles.serve(request, response);
        });
      }
    });

    httpServer.listen(config.port ? config.port : 2000);

    const webSocket = socketIO.listen(httpServer);

    if(config.deployment == "heroku") {
      webSocket.configure(function () {
        // taken from https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
        webSocket.set("transports", ["xhr-polling"]);
        webSocket.set("polling duration", 10);
      });
    }

    return webSocket;
  }
};