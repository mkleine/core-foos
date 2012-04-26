var remove = function (collection, expr) {
  collection.remove(expr);
};

var update = function (collection, selector, newValue, callback) {
  collection.update(selector, {$set:newValue}, {safe:true}, function(err, result) {
    callback();
  });
};

var upsert = function (collection, selector, newValue, callback) {
  collection.update(selector, {$set:newValue}, {upsert:true, safe:true}, function(err, result) {
     callback();
  });
};

var find = function (collection, expr, addExpr) {
  return collection.find(expr, addExpr);
};

var insert = function (collection, data, callback) {
  collection.insert(data, {safe:true},
          function (err, objects) {
            if (err) {
              console.warn(err.message);
            }
            if (err && err.message.indexOf('E11000 ') !== -1) {
              // this _id was already inserted in the database
            }
            callback()
          });
};

var count = function (collection, expr, callback) {
  return collection.count(expr, function (err, count) {
    console.log("Number of matches: " + count);
    callback(count);
  });
};

exports.remove = remove;
exports.update = update;
exports.upsert = upsert;
exports.find = find;
exports.insert = insert;
exports.count = count;