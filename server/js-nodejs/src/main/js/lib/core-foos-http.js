const express = require('express');
const url = require('url');
const socketIO = require('socket.io');
const repository = require('./core-foos-repository');
const util = require('./core-foos-util');
const config = util.parseConfig();
var logger = util.createLogger('### HTTP');

const COOKIE_USER_NAME = 'core_foos_user_name';
const COOKIE_QUICK_MATCH = 'core_foos_quick_match';

const DEFAULT_USER_NAME = 'quick-match';

function WebSocketHandler(webSocket) {

  function determineUserName(request, response) {
    var userName = request.cookies[COOKIE_USER_NAME];
    if(!userName){
      userName = DEFAULT_USER_NAME;
      response.cookie(COOKIE_USER_NAME, userName, {maxAge: 60});
    }
    return userName;
  }

  function sendRedirect(response, toUrl){
    response.writeHead(302, {
      'Location': toUrl || '/'
    });
    response.end();
  }

  function broadcastStateUpdate(upsertMatch, removeMatch, waitingPlayers) {
    const newState = {upsert:upsertMatch, remove:removeMatch, waiting_players:waitingPlayers};
    logger.log('broadcasting state update: ' + JSON.stringify(newState));

    webSocket.sockets.emit('update_state', newState);
  }

  this.quickMatch = function(request, response) {
    const parsedURL = url.parse(request.url, true);
    const playerName = determineUserName(request, response);
    logger.log("handling request: "+ JSON.stringify(parsedURL) + " (cookies: "+JSON.stringify(request.cookies) + ")");

    repository.requestImmediateMatch(playerName, function(m1, m2, p){
      const upsert = [];
      if(m1) {
        upsert.push(m1);
      }
      if(m2) {
        upsert.push(m2);
        response.cookie(COOKIE_QUICK_MATCH, m2._id, {maxAge: 3600*2});
      }
      broadcastStateUpdate(upsert, null, p);
      sendRedirect(response);
    });
  };

  this.endMatch = function(request, response) {
    logger.info('END MATCH');
  };

  this.endActiveMatch = function(req, res) {
    logger.info('END ACTIVE MATCH');
  };

}

module.exports = {
  createSocketServer : function(){

    const httpServer = express.createServer(
            express.logger({ format: ':method :url' }),
            express.cookieParser(),
            express.bodyParser(),
            express.static(config.dir ? config.dir : (__dirname + '/../client'))
    );
    logger.info('DIR: ' + __dirname);

    httpServer.listen(config.port ? config.port : 2000);

    const webSocket = socketIO.listen(httpServer);
    const handler = new WebSocketHandler(webSocket);

    httpServer.use('/quickmatch', handler.quickMatch);
    httpServer.use('/endactivematch', handler.endActiveMatch);
    httpServer.use('/endmatch', handler.endMatch);

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