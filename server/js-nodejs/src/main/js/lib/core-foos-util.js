function Logger(prefix, level) {
  var logLevel = level ? level : 0; // all
  var logPrefix = prefix ? prefix : "core-foos-util"; // self

  this.log = function(msg){
    if(logLevel < 1) {
      console.log(logPrefix + " - log: " + msg);
    }
  };

  this.info = function(msg) {
    if(logLevel < 2) {
      console.info(logPrefix + " - info: " + msg);
    }
  };

  this.warn = function(msg) {
    if(logLevel < 3) {
      console.warn(logPrefix + " - warn: " + msg);
    }
  };

  this.error = function(e) {
    console.error(logPrefix + " - error: " + e);
  }
}

module.exports = {
  doTryCatch : function(func){
    var result = undefined;
    try {
      result = func();
    } catch(e) {
      console.error('caught runtime exception' + e);
    }
    return result;
  },

  checkArgs : function(arg){
    for(i in arg){
      if(arg[i] == null) {
        throw new Error("argument " + i + " is missing!");
      }
    }
  },

  createLogger : function(prefix, level){
    return new Logger(prefix, level);
  }

};