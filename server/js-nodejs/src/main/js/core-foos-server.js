var mongodb = require('mongodb');
var mongo = require('./core-foos-server-mongo');

var usersCollection = "users";
var matchesCollection = "matches";

var server = new mongodb.Server("127.0.0.1", 27017, {});
var client = new mongodb.Db('test', server, {});
var users;
var matches;

var getUserByName = function (collection, userName) {
  return mongo.find(collection, {name:userName}, {});
};

var initialize = function () {
  console.log("initialize server");
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
}

var generateTestData = function (client) {
  requestPlay('Frauke');
  requestPlay('Tom');
  requestPlay('Moritz');
  requestPlay('Kai');
  requestPlay('xyz');
  requestMatch({});

  // cancelPlay('xyz');
  // getListOfUsers();

  matchPlayers();
  getNumberOfMatches(function(count) {
    console.log("Count:", count);
  });
};

var getListOfUsers = function (callback) {
  console.log("Get list of users");
  var result;
//  return mongo.find(err, users, {}, {limit:10});
  return mongo.find(users, {}, {limit:10}).toArray(function (err, docs) {
    callback(docs);
  });

  return result;
};

var requestPlay = function (newUsers) {
  console.log("Got users: " + newUsers + ", add " +newUsers.length + " users");
  for (i=0;i<newUsers.length;i++) {
    console.log("Add user: " + newUsers[i].name);
    if (newUsers[i].name) {
      mongo.insert(users, {name:newUsers[i].name});
    }
  }
};

var cancelPlay = function (userName) {
  mongo.remove(users, {name:userName});
};

var matchPlayers = function () {
//  var users = getListOfUsers(err);
//  if (users.size() >= 4) {
//    requestMatch(err, users);
//  }
};

var requestMatch = function (users) {
  mongo.insert(matches, {});
};

var endMatch = function (id) { //by id??
  mongo.remove(matches, {_id:id})
};

var getNumberOfMatches = function (callback) {
  mongo.count(matches, callback);
}

exports.getListOfUsers = getListOfUsers;
exports.requestPlay = requestPlay;
exports.cancelPlay = cancelPlay;
exports.requestMatch = requestMatch;
exports.endMatch = endMatch;
exports.initialize = initialize;
exports.getNumberOfMatches = getNumberOfMatches;