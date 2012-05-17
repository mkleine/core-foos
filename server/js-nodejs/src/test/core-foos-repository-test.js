process.on('uncaughtException', function(err){
  console.warn("Ignoring Exception");
  console.error(err.stack);
});

var exits = 2;
function doExit(msg){
  if(exits-- == 0){
    console.info('EXIT: ' + msg);
    process.exit(0);
  }
}

const repository = require('../main/js/lib/core-foos-repository');
repository.initialize(function(){
  doWithRepo(function(){
    doExit('repo_0');
  });
});

const repository1 = require('../main/js/lib/core-foos-repository');
repository1.initialize(function(){
  repository1.getPendingRequests(function(users){
    logger.log('PENDING: ' + JSON.stringify(users));
    doExit('repo_1');
  });
});

const repository2 = require('../main/js/lib/core-foos-repository');
repository2.initialize(
        function(){
          doExit('repo_2');
        }
);

const util = require('../main/js/lib/core-foos-util');
const logger = util.createLogger('### REPO-TEST:');

const callback = function(data){logger.log('registered: '+JSON.stringify(data));};

function doWithRepo(fun){
  with(repository) {
    logger.info("requesting matches ...");
    requestMatch([
      'Frauke'
    ], callback);
    requestMatch([
      'Tom'
    ], callback);
    requestMatch([
      'Moritz'
    ], callback);
    requestMatch([
      'Kai'
    ], callback);
    requestMatch([
      'xyz'
    ], callback);

    getPendingRequests(function (users) {
      logger.log("users: " + JSON.stringify(users) + " / length: " + users.length);
      cancelRequest('xyz', function(users){
        logger.log('match request of xyz cancelled');
        logger.log("Num users: " + users.length);
      });
    });

    requestMatch(['user1', 'user2', 'user3', 'user4'], function (data) {
      console.log('got data: '+JSON.stringify(data));
    });

    getPendingRequests(function (users) {
      logger.log("Num users: " + users.length)
    });
  }
}
