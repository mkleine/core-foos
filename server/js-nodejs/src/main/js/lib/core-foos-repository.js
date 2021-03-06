var mongo = require('./core-foos-mongo');
const util = require('./core-foos-util');
const logger = util.createLogger('### REPO:');

const MATCH_STATE_FINISHED = "FINISHED";
const MATCH_STATE_WAITING = "WAITING";
const MATCH_STATE_ACTIVE = "ACTIVE";

function toUsers(names){
  const result = [];
  names.forEach(function(name){result.push({name:name});});
  return result;
}

function toNames(users) {
  const result = [];
  users.forEach(function(user){result.push(user.name);});
  return result;
}

var getPendingRequests = function (callback) {
  // type Date => 9 http://www.mongodb.org/display/DOCS/Advanced+Queries#AdvancedQueries-%24type
  mongo.find(module.users, {requestDate : {$type : 9}}, {}).sort('requestDate', 1).limit(50).toArray(function (err, docs) {
    callback(docs);
  });
};

/**
 * Request match for the given array of user names
 * @param newUsers
 * @param callback
 */
var requestMatch = function (newUsers, callback) {
  logger.log("Request match: " + JSON.stringify(newUsers), callback);
  if (newUsers.length == 4) {
    mongo.find(module.matches,{state:MATCH_STATE_ACTIVE},{}).limit(1).toArray(function(err,activeMatches){
      const now = new Date();
      var newMatch = {
        requestDate:now,
        startDate: activeMatches && activeMatches.length > 0 ? null : now,
        state:     activeMatches && activeMatches.length > 0 ? MATCH_STATE_WAITING : MATCH_STATE_ACTIVE,
        players:   newUsers
      };
      logger.log("inserting new match " + JSON.stringify(newMatch), callback);
      mongo.insert(module.matches, newMatch, function(){
        const users = toUsers(newUsers);
        mongo.update(module.users, {$or : users}, {requestDate : null}, function(err, res) {
          exports.getPendingRequests(function(pendingRequests){
            callback(newMatch, pendingRequests)
          });
        });
      });
    });
  } else {
    insertRequests(newUsers, new Date(), callback);
  }
};

function MatchHandler(matches){

  this.insertMatch = function (newMatch, callback) {
    mongo.insert(matches, newMatch, callback);
  };

  this.getMatches = function(selector, callback) {
    mongo.find(module.matches,selector,{}).limit(1).toArray(function(err,result){
      if(err) {
        logger.warn("got error while retrieving matches",err);
      }
      callback(result ? result : []);
    })
  };

  this.updateMatches = function (selector, value, callback) {
    mongo.update()
  };

  return this;
}

function insertRequests(newUsers, date, callback){
  const userName = newUsers.pop();
  if (userName) {
    mongo.upsert(module.users, {name : userName}, {requestDate : date}, function () {
      insertRequests(newUsers, date, callback);
    });
  } else {
    matchPlayers(callback);
  }
}

var matchPlayers = function (callback) {
  getPendingRequests(function (waitingUsers) {
    if (waitingUsers && waitingUsers.length >= 4) {

      const remainingRequests = waitingUsers.splice(4);

      // TODO avoid recursion!
      requestMatch(toNames(waitingUsers), function(match){

        waitingUsers.forEach(function(user){
          logger.log('matching user: ' + JSON.stringify(user), callback);
          mongo.update(module.users, user, {requestDate:null}, function () {});
        });

        callback(match, remainingRequests);
      });
    } else {
      callback(null, waitingUsers);
    }
  });
};

/**
 * Start one of the waiting matches, if any
 * @param callback
 */
var startMatch = function (callback) {
  exports.getActiveMatch(function(activeMatch){
    if(activeMatch) {

      logger.warn("Cannot start new match while there's still an active match: " + JSON.stringify(activeMatch));
      callback();

    } else {

      exports.getWaitingMatches(function (docs) {

        if (docs && docs.length > 0) {

          exports.modifyMatch(docs[0], {state:MATCH_STATE_ACTIVE, startDate : new Date()},callback);

        } else {
          logger.warn("There's no match to start");
          callback();
        }

      });
    }
  });
};

var endMatch = function (query, callback) {
  logger.log("Ending match: "+ JSON.stringify(query), callback);
  mongo.find(module.matches, query,{}).toArray(function(err,docs){
    logger.log("Found matches to end: " + JSON.stringify(docs));

    if(docs && docs.length == 1){

      exports.modifyMatch(docs[0], {state:MATCH_STATE_FINISHED, endDate:new Date()}, callback);
      return;

    } else if(err) {
      logger.warn("got error:",err);
    } else {
      logger.info("ignoring 'endMatch' request because result length is not equals 1: " +JSON.stringify(docs));
    }
    callback();
  });
};

function copyInto(source,target) {
  Object.keys(source).forEach(function(key) {
    target[key] = source[key];
  });
  return target;
}

exports.modifyMatch = function(match, newValue, callback) {
  const msg = "modification of "+JSON.stringify(match) + " with " +  JSON.stringify(newValue);
  mongo.upsert(module.matches, match, newValue, function (err) {
    if(err){
      logger.warn("modification of "+JSON.stringify(match) + " with " + JSON.stringify(newValue) + " produced error: ",err);
      callback();
    } else {
      // prepare callback result
      const result = copyInto(newValue, copyInto(match, Object.create(null)));
      logger.info(msg +  " produced " + JSON.stringify(result));
      callback(result);
    }
  });
};

exports.getPendingRequests = getPendingRequests;
exports.requestMatch = requestMatch;
exports.endMatch = endMatch;
exports.startMatch = startMatch;
exports.initialize = function (callback) {
    if(module.initializing){
        logger.info('initializing ...');
        module.initializing.push(callback);
    } else if(module.users){
        logger.info('already initialized');
        callback();
    } else {
        module.initializing = [callback];
        mongo.openConnection(function (mongoResult) {
            module.users = mongoResult.users;
            module.matches = mongoResult.matches;
            logger.info('initialized');
            module.initializing.forEach(function(c){c()});
        });
    }
};

exports.getActiveMatch = function(callback) {
  mongo.find(module.matches, {state:MATCH_STATE_ACTIVE}, {}).toArray(function (err, result) {
    if(err) {
      logger.warn("cannot find active match: "+err);
    } else if(result && result.length > 1) {
      throw new Error("ILLEGAL STATE - more than one active matches found: " + JSON.stringify(result));
    }
    callback(result && result.length ? result[0] : null);
  });
};
exports.getWaitingMatches = function(callback) {
  mongo.find(module.matches, {state:MATCH_STATE_WAITING}, {}).sort('requestDate',1).limit(100).toArray(function (err, result) {
    if(err) {
      logger.warn("cannot find waiting matches: "+err);
    }
    callback(result);
  });
};

exports.cancelRequest = function (userName, callback) {
  mongo.update(module.users, {name:userName}, {name:userName, requestDate:null}, function(){
    getPendingRequests(callback);
  });
};

exports.requestImmediateMatch = function(playerName, callback/*(oldActiveMatch, newActiveMatch, waitingPlayers)*/) {
  // first reset current active match, if any
  exports.getActiveMatch(function(activeMatch){

    if(activeMatch) {
      if(activeMatch.players.indexOf(playerName) > -1) {

        logger.info('ignoring immediate match request for '+ playerName + ': he is already playing!');
        callback();

      } else if((new Date() - new Date(activeMatch.startDate)) < (300000)) {
        // if active match is not older than 5 minutes the players are probably on their way ... maybe

        logger.info('ignoring immediate match request for '+ playerName + ': current match is only ' +
                Math.round((new Date() - new Date(activeMatch.startDate)) / 1000) + ' seconds old');
        callback();

      } else {

        exports.modifyMatch(activeMatch, {state:MATCH_STATE_WAITING, startDate:null}, function(modifiedMatch) {
          exports.requestMatch([playerName,playerName,playerName,playerName],
                  function(newMatch, waitingPlayers){
                    logger.info('immediate match request produced ' + JSON.stringify({
                      modifiedMatch : modifiedMatch,
                      newMatch : newMatch,
                      waitingPlayers : waitingPlayers
                    }));
                    callback(modifiedMatch, newMatch, waitingPlayers);
                  });
        });

      }
    } else {

      exports.requestMatch([playerName,playerName,playerName,playerName],
              function(newMatch, waitingPlayers){
                callback(null, newMatch, waitingPlayers);
              });
    }
  });
};
