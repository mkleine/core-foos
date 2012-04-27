var mongodb = require('mongodb');
var mongo = require('./core-foos-server-mongo');

var usersCollection = "users";
var matchesCollection = "matches";

var users;
var matches;


var USER_STATE_MATCH_REQUESTED = "MATCH_REQUESTED";
var USER_STATE_WAITING = "WAITING";
var USER_STATE_FINISHED = "FINISHED";
var USER_STATE_CANCELLED = "CANCELLED";

var MATCH_STATE_FINISHED = "FINISHED";
var MATCH_STATE_WAITING = "WAITING";
var MATCH_STATE_ACTIVE = "ACTIVE";

var initialize = function (config) {
  const mongoHost = config.mongoHost ? config.mongoHost : 'localhost';
  const mongoPort = config.mongoPort ? config.mongoPort : 27017;
  const mongoDbName = config.mongoDb ? config.mongoDb : 'core-foos';
  console.log("initializing server: " + mongoDbName + ":" + mongoHost + ":" + mongoPort);

  var server = new mongodb.Server(mongoHost, mongoPort, {});
  var client = new mongodb.Db(mongoDbName, server, {});
  client.open(function (err, client) {
    console.log("Open");
    if (err) {
      throw err;
    }
    users = new mongodb.Collection(client, usersCollection);
    users.ensureIndex({name:1}, {unique:true}, {});
    matches = new mongodb.Collection(client, matchesCollection);
    //generateTestData(client);
    console.log("Really open");
  });
  console.log("ready for action");
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
      console.log("Num users: " + users.length)
      cancelPlay('xyz');
      getListOfUsers(function (users) {
        console.log("Num users: " + users.length)
      });
    });
  });

  requestMatch('user1', 'user2', 'user3', 'user4', function () {
  });

  getListOfUsers(function (users) {
    console.log("Num users: " + users.length)
  });


  getNumberOfMatches(function (count) {
    console.log("Number of matches:", count);
  });

  startMatch(function () {
    console.log("starting match");
    currentMatch(function (match) {
      if (match) {
        console.log("end match..." + match._id)
        endMatch(match._id.toString(), function () {
        });
      }
    })
  });
};

var getListOfUsers = function (callback) {
  console.log("Get list of users");
  return mongo.find(users, {state:USER_STATE_WAITING}, {}).sort('date', 1).limit(50).toArray(function (err, docs) {
    callback(docs);
  });
};

var getListOfMatches = function (callback) {
  console.log("Get list of matches");
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
  console.log("Got users: " + newUsers + ", add " + newUsers.length + " users");
  if (newUsers.length == 4) {
    requestMatch(newUsers[0].name, newUsers[1].name, newUsers[2].name, newUsers[3].name, callback);
  } else {
    for (i = 0; i < newUsers.length; i++) {
      console.log("Add user: " + newUsers[i].name);
      if (newUsers[i].name && newUsers[i].name.length > 0) {
        mongo.upsert(users, {name:newUsers[i].name}, {state:USER_STATE_WAITING, date:new Date()}, function () {
          matchPlayers(callback);
        });
      }
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
            console.log("Really start match");
            callback({match:match, date:date});
          });
        } else {
          callback();
        }
      });
    }
  });
};

var endMatch = function (id, callback) { //by id??
  mongo.find(matches, {_id:mongodb.ObjectID.createFromHexString(id)}, {}).toArray(function (err, matchesArray) {
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

exports.getListOfUsers = getListOfUsers;
exports.requestPlay = requestPlay;
exports.cancelPlay = cancelPlay;
exports.endMatch = endMatch;
exports.currentMatch = currentMatch;
exports.initialize = initialize;
exports.getNumberOfMatches = getNumberOfMatches;
exports.getNumberOfActiveMatches = getNumberOfActiveMatches;
exports.getListOfMatches = getListOfMatches;
exports.administration = function (cmd, callback) {
  if (cmd == "dropUsers") {
    mongo.remove(users, {});
  } else if (cmd == "dropMatches") {
    mongo.remove(matches, {});
  } else {
    console.warn("unknown cmd: " + cmd);
  }
  callback();
};
