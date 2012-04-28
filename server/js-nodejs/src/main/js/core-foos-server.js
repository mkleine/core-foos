var mongodb = require('mongodb');
var mongo = require('./lib/core-foos-mongo');
const logger = require('./lib/core-foos-util').createLogger('core-foos-server');

const usersCollection = "users";
const matchesCollection = "matches";
const countersCollection = "counters";

var users;
var matches;
var counters;

const USER_STATE_MATCH_REQUESTED = "MATCH_REQUESTED";
const USER_STATE_WAITING = "WAITING";
const USER_STATE_FINISHED = "FINISHED";
const USER_STATE_CANCELLED = "CANCELLED";

const MATCH_STATE_FINISHED = "FINISHED";
const MATCH_STATE_WAITING = "WAITING";
const MATCH_STATE_ACTIVE = "ACTIVE";

const COUNTER_NAME_NUM_MATCHES = "counter:numberOfMatches";

var initialize = function (config) {
  const mongoHost = config.mongoHost ? config.mongoHost : 'localhost';
  const mongoPort = config.mongoPort ? config.mongoPort : 27017;
  const mongoDbName = config.mongoDb ? config.mongoDb : 'core-foos';
  logger.log("initializing server: " + mongoDbName + ":" + mongoHost + ":" + mongoPort);

  var server = new mongodb.Server(mongoHost, mongoPort, {});
  var client = new mongodb.Db(mongoDbName, server, {});
  client.open(function (err, client) {
    if (err) {
      throw err;
    }
    users = new mongodb.Collection(client, usersCollection);
    users.ensureIndex({name:1}, {unique:true});
    matches = new mongodb.Collection(client, matchesCollection);
    counters = new mongodb.Collection(client, countersCollection);
    mongo.upsert(counters, {name:COUNTER_NAME_NUM_MATCHES}, {value:0}, function () {
    });
    logger.log("Mongo connection open");

    if(config.generateTestData){
      logger.log("generating test data ...");
      generateTestData(client);
    }
  });
};

var generateTestData = function (client) {
  requestPlay([
    {name:'Frauke'}
  ], function () {
  });
  requestPlay([
    {name:'Tom'}
  ], function () {
  });
  requestPlay([
    {name:'Moritz'}
  ], function () {
  });
  requestPlay([
    {name:'Kai'}
  ], function () {
  });
  requestPlay([
    {name:'xyz'}
  ], function () {
    getListOfUsers(function (users) {
      logger.log("Num users: " + users.length)
      cancelPlay('xyz');
      getListOfUsers(function (users) {
        logger.log("Num users: " + users.length)
      });
    });
  });

  requestMatch('user1', 'user2', 'user3', 'user4', function () {
  });

  getListOfUsers(function (users) {
    logger.log("Num users: " + users.length)
  });


  getNumberOfMatches(function (count) {
    logger.log("Number of matches:", count);
  });

  startMatch(function () {
    logger.log("starting match");
    currentMatch(function (match) {
      if (match) {
        logger.log("end match..." + match._id)
        endMatch(function () {
        });
      }
    })
  });
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

var getNumberOfMatches = function (callback) {
  mongo.count(matches, {state:MATCH_STATE_WAITING}, callback);
};

var getNumberOfActiveMatches = function (callback) {
  mongo.count(matches, {state:MATCH_STATE_ACTIVE}, callback);
};

var requestPlay = function (newUsers, callback) {
  logger.log("Got users: " + JSON.stringify(newUsers) + ", adding " + newUsers.length + " users");
  if (newUsers.length == 4) {
    logger.log("new users = 4");
    requestMatch(newUsers[0].name, newUsers[1].name, newUsers[2].name, newUsers[3].name, callback);
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

var requestMatch = function (userName1, userName2, userName3, userName4, callback) {
  mongo.upsert(users, {name:userName1}, {state:USER_STATE_MATCH_REQUESTED, date:new Date()}, function () {
  });
  mongo.upsert(users, {name:userName2}, {state:USER_STATE_MATCH_REQUESTED, date:new Date()}, function () {
  });
  mongo.upsert(users, {name:userName3}, {state:USER_STATE_MATCH_REQUESTED, date:new Date()}, function () {
  });
  mongo.upsert(users, {name:userName4}, {state:USER_STATE_MATCH_REQUESTED, date:new Date()}, function () {
    mongo.insert(matches, {requestDate:new Date(), player1:userName1, player2:userName2, player3:userName3, player4:userName4, state:MATCH_STATE_WAITING}, function () {
      startMatch(callback);
    });
  });
};


var matchPlayers = function (callback) {
  getListOfUsers(function (users) {
    if (users.length >= 4) {
      requestMatch(users[0].name, users[1].name, users[2].name, users[3].name, callback);
    }
  });
};

var cancelPlay = function (userName) {
  mongo.update(users, {name:userName}, {name:userName, state:USER_STATE_CANCELLED}, function () {
  });
};

var startMatch = function (callback) {
  mongo.find(matches, {state:MATCH_STATE_ACTIVE}, {}).toArray(function (err, result) {
    if (result && result.length > 0) {
      callback();
    } else {
      getListOfMatches(function (docs) {
        if (docs && docs.length > 0) {
          var match = docs[0];
          var date = new Date();
          mongo.upsert(matches, {_id:match._id}, {state:MATCH_STATE_ACTIVE, startDate:date}, function () {
            logger.log("Really start match");
            callback({match:match, date:date});
            mongo.incrementCounter(counters, COUNTER_NAME_NUM_MATCHES);
          });
        } else {
          callback();
        }
      });
    }
  });
};

var endMatch = function (callback) {
  logger.log("End match");
  mongo.find(matches, {state:MATCH_STATE_ACTIVE}, {}).toArray(function (err, matchesArray) {
    if (matchesArray && matchesArray.length > 0) {
      var match = matchesArray[0];
      mongo.update(users, {name:match.userName1}, {state:USER_STATE_FINISHED}, function () {
      });
      mongo.update(users, {name:match.userName2}, {state:USER_STATE_FINISHED}, function () {
      });
      mongo.update(users, {name:match.userName3}, {state:USER_STATE_FINISHED}, function () {
      });
      mongo.update(users, {name:match.userName4}, {state:USER_STATE_FINISHED}, function () {
      });
      mongo.update(matches, {_id:match._id}, {state:MATCH_STATE_FINISHED, endDate:new Date()}, function () {
        startMatch(callback);
      });
    }
  });
};

var currentMatch = function (callback) {
  mongo.find(matches, {state:MATCH_STATE_ACTIVE}, {}).toArray(function (err, result) {
    if (result && result.length > 0) {
      callback(result[0]);
      return;
    }
    callback();
  });
};

var getNumberOfPlayedMatches = function (callback) {
  mongo.find(counters, {name:COUNTER_NAME_NUM_MATCHES}, {}).toArray(function (err, result) {
    if (result && result.length > 0) {
      logger.log("# played matches: " + result[0].value)
      callback(result[0].value);
    } else {
      callback();
    }
  })
};


exports.getListOfUsers = getListOfUsers;
exports.requestPlay = requestPlay;
exports.cancelPlay = cancelPlay;
exports.endMatch = endMatch;
exports.currentMatch = currentMatch;
exports.initialize = initialize;
exports.getNumberOfMatches = getNumberOfMatches;
exports.getNumberOfActiveMatches = getNumberOfActiveMatches;
exports.getListOfMatches = getListOfMatches;
exports.getNumberOfPlayedMatches = getNumberOfPlayedMatches;
exports.administration = function (cmd, callback) {
  if (cmd == "dropUsers") {
    mongo.remove(users, {});
  } else if (cmd == "dropMatches") {
    mongo.remove(matches, {});
  } else {
    logger.warn("unknown cmd: " + cmd);
  }
  callback();
};
exports.lastFinishedMatch = function (callback) {
  mongo.find(matches, {state:MATCH_STATE_FINISHED}, {}).sort('date', -1).limit(1).toArray(function (err, result) {
    if (result && result.length > 0) {
      callback(result[0]);
    }
  });
};
