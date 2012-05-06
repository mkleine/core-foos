var mongo = require('./lib/core-foos-mongo');
const util = require('./lib/core-foos-util');
const logger = util.createLogger('core-foos-server');

var users;
var matches;

const USER_STATE_MATCH_REQUESTED = "MATCH_REQUESTED";
const USER_STATE_WAITING = "WAITING";
const USER_STATE_FINISHED = "FINISHED";
const USER_STATE_CANCELLED = "CANCELLED";

const MATCH_STATE_FINISHED = "FINISHED";
const MATCH_STATE_WAITING = "WAITING";
const MATCH_STATE_ACTIVE = "ACTIVE";

var initialize = function () {
  config = util.parseConfig();
  mongo.openConnection(function (mongoResult) {
    users = mongoResult.users;
    matches = mongoResult.matches;

    if(config.generateTestData){
      logger.log("generating test data ...");
      generateTestData();
    }
  });
};

var generateTestData = function () {
  logger.info("requesting matches ...");
  var callback = function(data){logger.log('registered: '+JSON.stringify(data));};
  requestMatch([
    'Frauke'
  ], callback);
  requestMatch([
    'Tom'
  ], callback);
  requestMatch([
    'Moritz'
  ], callback);
  requestMatch([
    'Kai'
  ], callback);
  requestMatch([
    'xyz'
  ], callback);

  getListOfUsers(function (users) {
    logger.log("Num users: " + users.length);
    cancelPlay('xyz');
    getListOfUsers(function (users) {
      logger.log("Num users: " + users.length);
    });
  });

  requestMatch(['user1', 'user2', 'user3', 'user4'], function (data) {
    console.log('got data: '+JSON.stringify(data));
  });

  getListOfUsers(function (users) {
    logger.log("Num users: " + users.length)
  });

  logger.info("test data generated");
};

var getListOfUsers = function (callback) {
  logger.log("Get list of users");
  mongo.find(users, {state:USER_STATE_WAITING}, {}).sort('date', 1).limit(50).toArray(function (err, docs) {
    callback(docs);
  });
};

var getListOfMatches = function (callback) {
  logger.log("Get list of matches");
  return mongo.find(matches, {state:MATCH_STATE_WAITING}, {}).sort('date', 1).limit(50).toArray(function (err, docs) {
    callback(docs);
  });
};

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
        player1:   newUsers[0],
        player2:   newUsers[1],
        player3:   newUsers[2],
        player4:   newUsers[3]
      };
      logger.log("inserting new match " + JSON.stringify(newMatch));
      mongo.insert(matches, newMatch, function(){
        callback(newMatch);
      });
    });
  } else {
    for (i = 0; i < (newUsers.length - 1); i++) {
      logger.log("Add user: " + newUsers[i].name);
      if (newUsers[i].name && newUsers[i].name.length > 0) {
        mongo.upsert(users, {name:newUsers[i].name}, {state:USER_STATE_WAITING, date:new Date()}, function () {
        });
      }
    }
    if (newUsers[newUsers.length - 1].name && newUsers[newUsers.length - 1].name.length > 0) {
      mongo.upsert(users, {name:newUsers[newUsers.length - 1].name}, {state:USER_STATE_WAITING, date:new Date()}, function () {
          matchPlayers(callback);
      });
    }
  }
};

var matchPlayers = function (callback) {
  getListOfUsers(function (users) {
    if (users.length >= 4) {
      // TODO reset waiting flags of users
      requestMatch([users[0].name, users[1].name, users[2].name, users[3].name], callback);
    }
  });
};

var cancelPlay = function (userName) {
  mongo.update(users, {name:userName}, {name:userName, state:USER_STATE_CANCELLED}, function () {
  });
};

var startMatch = function (callback) {
  exports.getActiveMatch(function(activeMatch){
    if(activeMatch) {

      logger.warn("Cannot start new match while there's still an active match: " + JSON.stringify(activeMatch));
      callback();

    } else {

      getListOfMatches(function (docs) {

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

// function({matchId : matchId, name : userName}, callback)
var endMatch = function (data, callback) {
  logger.log("End match: "+ JSON.stringify(data), callback);
  mongo.find(matches, {_id:data.matchId},{}).toArray(function(err,docs){
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

exports.getListOfUsers = getListOfUsers;
exports.requestMatch = requestMatch;
exports.cancelPlay = cancelPlay;
exports.endMatch = endMatch;
exports.startMatch = startMatch;
exports.initialize = initialize;
exports.getListOfMatches = getListOfMatches;
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
