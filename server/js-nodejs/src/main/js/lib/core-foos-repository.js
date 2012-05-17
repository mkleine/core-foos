var mongo = require('./core-foos-mongo');
const util = require('./core-foos-util');
const logger = util.createLogger('### REPO:');

var users;
var matches;

const MATCH_STATE_FINISHED = "FINISHED";
const MATCH_STATE_WAITING = "WAITING";
const MATCH_STATE_ACTIVE = "ACTIVE";

var initialize = function (callback) {
  logger.info('initializing repository ...');
  config = util.parseConfig();
  mongo.openConnection(function (mongoResult) {
    users = mongoResult.users;
    matches = mongoResult.matches;
    initialize= function(f) {f();}; // immediate callback
    callback();
  });
};

var getPendingRequests = function (callback) {
  logger.log("Get list of waiting users");
  // type Date => 9 http://www.mongodb.org/display/DOCS/Advanced+Queries#AdvancedQueries-%24type
  mongo.find(users, {requestDate : {$type : 9}}, {}).sort('requestDate', 1).limit(50).toArray(function (err, docs) {
    callback(docs);
  });
};

/**
 * Request match for the given array of user names
 * @param newUsers
 * @param callback
 */
var requestMatch = function (newUsers, callback) {
  logger.log("Got users: " + JSON.stringify(newUsers) + ", adding " + newUsers.length + " users");
  if (newUsers.length == 4) {
    logger.log("new users = 4");
    mongo.find(matches,{state:MATCH_STATE_ACTIVE},{}).limit(1).toArray(function(err,activeMatches){
      const now = new Date();
      var newMatch = {
        requestDate:now,
        startDate: activeMatches && activeMatches.length > 0 ? null : now,
        state:     activeMatches && activeMatches.length > 0 ? MATCH_STATE_WAITING : MATCH_STATE_ACTIVE,
        players:   newUsers
      };
      logger.log("inserting new match " + JSON.stringify(newMatch));
      mongo.insert(matches, newMatch, function(){
        newUsers.every(function(user){
          mongo.update(users, {name:user}, {requestDate:null}, function () {});
          return true;
        });
        exports.getPendingRequests(function(pendingRequests){
          callback(newMatch, pendingRequests)
        });
      });
    });
  } else {
    const now = new Date();
    newUsers.every(function(user){
      mongo.upsert(users, {name:user}, {requestDate:now}, function () {});
      return true;
    });
    matchPlayers(callback);
  }
};

var matchPlayers = function (callback) {
  getPendingRequests(function (waitingUsers) {
    if (waitingUsers && waitingUsers.length >= 4) {

      // TODO avoid recursion!
      requestMatch([waitingUsers[0].name, waitingUsers[1].name, waitingUsers[2].name, waitingUsers[3].name], function(match){

        waitingUsers.every(function(user,index){
          logger.log('matching user: ' + user.name);
          mongo.update(users, {name:user.name}, {requestDate:null}, function () {});
          return index < 3; // stop after 4th user
        });

        callback(match, waitingUsers.splice(4));
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
          var match = docs[0];
          var date = new Date();
          mongo.upsert(matches, {_id:match._id}, {state:MATCH_STATE_ACTIVE, startDate:date}, function () {
            logger.log("Starting match: " + JSON.stringify(match));
            match.startDate = date;
            callback(match);
          });
        } else {
          logger.warn("There's no match to start");
          callback();
        }

      });
    }
  });
};

// function({matchId : matchId, name : userName, startedBefore: date, requestedBefore : newerThan}, callback)
var endMatch = function (data, callback) {
  logger.log("End match: "+ JSON.stringify(data), callback);
  const query = {_id:data.matchId};
  if(data.name) {
    query.players = data.name;
  }
  if(data.startedBefore) {
    query.startDate = {$lt: data.startedBefore};
  }
  if(data.requestedBefore){
    query.requestDate = {$lt: data.requestedBefore};
  }
  mongo.find(matches, query,{}).toArray(function(err,docs){
    console.log("Found match to end: " + JSON.stringify(docs));

    if(!err && docs && docs.length == 1){

      const newValue = {state:MATCH_STATE_FINISHED, endDate:new Date()};
      mongo.upsert(matches, {_id:data.matchId}, newValue, function (err, result) {
        if(err){
          callback();
        } else {
          const finishedMatch = docs[0];
          finishedMatch.state = newValue.state;
          finishedMatch.endDate = newValue.endDate
          callback(finishedMatch);
        }
      });

    } else {
      callback();
    }
  });
};

exports.getPendingRequests = getPendingRequests;
exports.requestMatch = requestMatch;
exports.endMatch = endMatch;
exports.startMatch = startMatch;
exports.initialize = initialize;
exports.getActiveMatch = function(callback) {
  mongo.find(matches, {state:MATCH_STATE_ACTIVE}, {}).toArray(function (err, result) {
    if(err) {
      logger.warn("cannot find active match: "+err);
    } else if(result && result.length > 1) {
      throw new Error("ILLEGAL STATE - more than one active matches found: " + JSON.stringify(result));
    }
    callback(result && result.length ? result[0] : null);
  });
};
exports.getWaitingMatches = function(callback) {
  mongo.find(matches, {state:MATCH_STATE_WAITING}, {}).sort('requestDate',1).limit(100).toArray(function (err, result) {
    if(err) {
      logger.warn("cannot find waiting matches: "+err);
    }
    callback(result);
  });
};

exports.cancelRequest = function (userName, callback) {
  mongo.update(users, {name:userName}, {name:userName, requestDate:null}, function(){
    getPendingRequests(callback);
  });
};

exports.requestImmediateMatch = function(playerName, callback/*(oldActiveMatch, newActiveMatch, waitingPlayers)*/) {
  // first reset current active match, if any
  exports.getActiveMatch(function(activeMatch){
    if(activeMatch) {
      if(activeMatch.players.indexOf(playerName) > -1) {

        logger.info('ignoring immediate match request for '+ playerName);
        callback();

      } else {

        const newValue = {state:MATCH_STATE_WAITING, startDate:null};
        mongo.update(matches, {_id:activeMatch._id}, newValue, function (err, result) {

          activeMatch.state = newValue.state;
          activeMatch.startDate = null;

          exports.requestMatch([playerName,playerName,playerName,playerName],
                  function(newMatch, waitingPlayers){
                    callback(activeMatch, newMatch, waitingPlayers);
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
