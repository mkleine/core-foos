var remove = function (collection, expr) {
  collection.remove(expr);
};

var update = function (collection, oldValue, newValue) {
  collection.update(oldValue, newValue);
};

var find = function (collection, expr, addExpr) {
  return collection.find(expr, addExpr);
};

var insert = function (collection, data) {
  collection.insert(data, {safe:true},
          function (err, objects) {
            if (err) {
              console.warn(err.message);
            }
            if (err && err.message.indexOf('E11000 ') !== -1) {
              // this _id was already inserted in the database
            }
          });
};

var count = function (collection, callback) {
  return collection.count({}, function (err, count) {
    console.log("Number of matches: " + count);
    callback(count);
  });
}

exports.remove = remove;
exports.update = update;
exports.find = find;
exports.insert = insert;
exports.count = count;