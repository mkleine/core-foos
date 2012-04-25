var mongodb = require('mongodb');
var usersCollection = "users";

var server = new mongodb.Server("127.0.0.1", 27017, {});
var client = new mongodb.Db('test', server, {});
var users;

var insert = function(err, collection, data) {
  collection.insert(data, {safe:true},
          function(err, objects) {
            if (err) console.warn(err.message);
            if (err && err.message.indexOf('E11000 ') !== -1) {
              // this _id was already inserted in the database
            }
          });
}

var remove = function(err, collection, id) {
  collection.remove({_id: id});
}

var update = function(err, collection, oldValue, newValue) {
  collection.update(oldValue, newValue);
}

client.open(function(err, client) {
  if (err) throw err;
  users = new mongodb.Collection(client, usersCollection);
  generateTestData(err, client);
});

var generateTestData = function(err, client) {
  insert(err, users, {name:'Frauke'});
}

var getListOfUsers = function(err) {
  return users.find();
}

var requestPlay = function(err, user) {
  insert(users, user);
}