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
  ]);
  requestPlay([
    {name:'Tom'}
  ]);
  requestPlay([
    {name:'Moritz'}
  ]);
  requestPlay([
    {name:'Kai'}
  ]);
  requestPlay([
    {name:'xyz'}
  ]);
  requestMatch('user1', 'user2', 'user3', 'user4');

  // cancelPlay('xyz');
  getListOfUsers(function (users) {
    console.log("Num users: " + users.length)
  });

  matchPlayers();
  getNumberOfMatches(function (count) {
    console.log("Count:", count);
  });
};

var getListOfUsers = function (callback) {
  console.log("Get list of users");
  return mongo.find(users, {state:USER_STATE_WAITING}, {}).sort('date', 1).limit(50).toArray(function (err, docs) {
    callback(docs);
  });
};

var getNumberOfMatches = function (callback) {
  mongo.count(matches, {state:MATCH_STATE_WAITING}, callback);
};

var requestPlay = function (newUsers, callback) {
  console.log("Got users: " + newUsers + ", add " + newUsers.length + " users");
  if (newUsers.length == 4) {
    requestPlayForGroup(newUsers[0].name, newUsers[1].name, newUsers[2].name, newUsers[3].name);
  } else {
    for (i = 0; i < newUsers.length; i++) {
      console.log("Add user: " + newUsers[i].name);
      if (newUsers[i].name) {
        mongo.upsert(users, {name:newUsers[i].name}, {state:USER_STATE_WAITING, date:new Date()}, function () {
          matchPlayers();
        });
      }
    }
  }
};

var requestPlayForGroup = function (userName1, userName2, userName3, userName4) {
  console.log("Got users: " + users + ", add " + userName1 + " " + userName2 + " " + userName3 + " " + userName4);
  var currentDate = new Date();
  mongo.upsert(users, {name:userName1}, {state:USER_STATE_MATCH_REQUESTED, date:currentDate}, function () {
  });
  mongo.upsert(users, {name:userName2}, {state:USER_STATE_MATCH_REQUESTED, date:currentDate}, function () {
  });
  mongo.upsert(users, {name:userName3}, {state:USER_STATE_MATCH_REQUESTED, date:currentDate}, function () {
  });
  mongo.upsert(users, {name:userName4}, {state:USER_STATE_MATCH_REQUESTED, date:currentDate}, function () {
  });
  requestMatch(userName1, userName2, userName3, userName4);
};

var requestMatch = function (userName1, userName2, userName3, userName4) {
  mongo.insert(matches, {date:new Date(), player1:userName1, player2:userName2, player3:userName3, player4:userName4, state:MATCH_STATE_WAITING});
  mongo.upsert(users, {name:userName1}, {state:USER_STATE_MATCH_REQUESTED}, function () {
  });
  mongo.upsert(users, {name:userName2}, {state:USER_STATE_MATCH_REQUESTED}, function () {
  });
  mongo.upsert(users, {name:userName3}, {state:USER_STATE_MATCH_REQUESTED}, function () {
  });
  mongo.upsert(users, {name:userName4}, {state:USER_STATE_MATCH_REQUESTED}, function () {
  });
};


var matchPlayers = function () {
  getListOfUsers(function (users) {
    if (users.length >= 4) {
      requestMatch(users[0].name, users[1].name, users[2].name, users[3].name);
    }
  });
};

var cancelPlay = function (userName) {
  mongo.update(users, {name:userName}, {name:userName, state:USER_STATE_CANCELLED});
};

var endMatch = function (id) { //by id??
  mongo.find(matches, {_id:id}).toArray(function (err, matchesArray) {
    if (matchesArray && matchesArray.length > 0) {
      var match = matchesArray.get(0);
      mongo.update(users, {name:match.userName1}, {state:USER_STATE_FINISHED});
      mongo.update(users, {name:match.userName2}, {state:USER_STATE_FINISHED});
      mongo.update(users, {name:match.userName3}, {state:USER_STATE_FINISHED});
      mongo.update(users, {name:match.userName4}, {state:USER_STATE_FINISHED});
      mongo.update(matches, {_id:match._id}, {state:MATCH_STATE_FINISHED});
    }
  });
};

exports.getListOfUsers = getListOfUsers;
exports.requestPlay = requestPlay;
exports.cancelPlay = cancelPlay;
exports.endMatch = endMatch;
exports.initialize = initialize;
exports.getNumberOfMatches = getNumberOfMatches;