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

var initialize = function() {
  console.log("initialize server");
  client.open(function (err, client) {
    console.log("Open");
    if (err) {
      throw err;
    }
    users = new mongodb.Collection(client, usersCollection);
    users.ensureIndex({name:1}, {unique:true}, {});
    matches = new mongodb.Collection(client, matchesCollection);
    // generateTestData(client);
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

  // cancelPlay('xyz');
  // getListOfUsers();

  matchPlayers();
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

var requestPlay = function (userName) {
  console.log("Got users: " + users + ", add " +userName);
  mongo.insert(users, {name:userName});
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

var endMatch = function(id) { //by id??
  mongo.remove(matches, {_id:id})
};

exports.getListOfUsers = getListOfUsers;
exports.requestPlay = requestPlay;
exports.cancelPlay = cancelPlay;
exports.requestMatch = requestMatch;
exports.endMatch = endMatch;
exports.initialize = initialize;