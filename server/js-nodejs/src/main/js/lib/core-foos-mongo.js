//noinspection JSUnresolvedFunction
const util = require('./core-foos-util.js');
const mongodb = require('mongodb');
var logger = util.createLogger('### MONGO');

function wrapId(data) {
  if(data._id){
    logger.info("wrapping _id into new BSONPure.ObjectId: " + data._id);
    data._id = new mongodb.BSONPure.ObjectID(new String(data._id));
  }
  return data;
}

function logUpdateResult(err, count){
  if(err){
    logger.error('error while updating collection :');
    console.dir(err);
  } else {
    logger.log('updating collection affected ' + count +  " documents");
  }
}
//noinspection JSUnresolvedVariable
module.exports = {
  openConnection : function (callback) {
    var config = util.parseConfig();
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
      var result = Object.create(null);
      result.client = client;
      result.users = new mongodb.Collection(client, 'users');
      result.users.ensureIndex({name:1}, {unique:true});
      result.matches = new mongodb.Collection(client, 'matches');
      result.counters = new mongodb.Collection(client, 'counters');

      callback(result);
      logger.log("connection open");
    });
  },

  remove : function (collection, expr) {
    util.checkArgs({collection : collection, expr : expr});
    collection.remove(wrapId(expr),function(err){
      if(err) {
        logger.error("error while removing " +  expr + " from collection " + collection + ": ");
        console.dir(err);
      } else {
        logger.log('removed' +  expr + ' from collection ' + collection);
      }
    });
  },

  update : function (collection, selector, newValue, callback) {
    logger.log("updating " + JSON.stringify(newValue) + " on " + JSON.stringify(selector));
    collection.update(wrapId(selector), {$set:newValue}, {safe:true}, function(err, count) {
      logUpdateResult(err, count);
      callback(err, count);
    });
  },

  upsert : function (collection, selector, newValue, callback) {
    logger.log("upserting " + JSON.stringify(newValue) + " on " + JSON.stringify(selector));
    collection.update(wrapId(selector), {$set:newValue}, {upsert:true, safe:true}, function(err, count) {
      logUpdateResult(err, count);
      callback(err, count);
    });
  },

  find : function (collection, expr, addExpr) {
    return collection.find(wrapId(expr), addExpr);
  },

  insert : function (collection, data, callback) {
    collection.insert(data, {safe:true},
            function (err, objects) {
              if (err) {
                logger.warn(err.message);
              }
              if (err && err.message.indexOf('E11000 ') !== -1) {
                // this _id was already inserted in the database
              }
              logger.log("insertion produced " + objects ? JSON.stringify(objects) : "no result");
              callback()
            });
  },

  /**
   * Count the objects matching the given expression and pass the result to the given callback
   * @param collection
   * @param expr
   * @param callback
   */
  count : function (collection, expr, callback) {
    collection.count(wrapId(expr), function (err, count) {
      logger.log("Number of matches: " + count);
      callback(count);
    });
  },

  /**
   * Increment a counter in the given collection
   * @param collection the collection containing the counter
   * @param name the name of the counter
   */
  incrementCounter : function (collection, name) {
    logger.log("incrementing counter " + name);
    collection.update({name:name}, {$inc:{value:1}});
  },

  setLogger : function(aLogger) {
    logger = aLogger;
  }
};