
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

exports.remove = remove;
exports.update = update;
exports.find = find;
exports.insert = insert;