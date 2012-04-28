//noinspection JSUnresolvedFunction
const util = require('./core-foos-util.js');
var logger = util.createLogger('core-foos-mongo');

function logUpdateResult(err,result){
  if(err){
    logger.error('error while updating collection :');
    console.dir(err);
  } else {
    logger.log('updating collection procuded result: ' + result);
  }
}
//noinspection JSUnresolvedVariable
module.exports = {
  remove : function (collection, expr) {
    util.checkArgs({collection : collection, expr : expr});
    collection.remove(expr,function(err){
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
    collection.update(selector, {$set:newValue}, {safe:true}, function(err, result) {
      logUpdateResult(err,result);
      callback();
    });
  },

  upsert : function (collection, selector, newValue, callback) {
    logger.log("upserting " + JSON.stringify(newValue) + " on " + JSON.stringify(selector));
    collection.update(selector, {$set:newValue}, {upsert:true, safe:true}, function(err, result) {
      logUpdateResult(err,result);
      callback();
    });
  },

  find : function (collection, expr, addExpr) {
    return collection.find(expr, addExpr);
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
    collection.count(expr, function (err, count) {
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