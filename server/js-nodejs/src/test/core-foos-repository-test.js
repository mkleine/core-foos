process.on('uncaughtException', function(err){
  console.error(err.stack);
  process.exit(1);
});

setTimeout(function(){
  console.info('test timed out!');
  process.exit(1);
},10000);

const util = require('../main/js/lib/core-foos-util');
const logger = util.createLogger('### REPO-TEST:');

var exits = 2;
function doExit(msg){
  if(exits-- == 0){
    logger.info('EXIT: ' + msg);
    process.exit(0);
  }
}

const mongo = require('../main/js/lib/core-foos-mongo');
mongo.openConnection(function(mongoData){
  logger.warn('>>>>>>>>>>>>>>> clearing DB <<<<<<<<<<<<<<<<<');
  mongo.remove(mongoData.users,{});
  mongo.remove(mongoData.matches,{});
});

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
repository2.initialize(function(){
  repository2.getPendingRequests(function(users){
    logger.log('PENDING: ' + JSON.stringify(users));
    doExit('repo_2');
  });
});

function doWithRepo(fun){
  logger.info("requesting matches ...");

  const userToAdd = [
    ['u1', 'u2', 'u3'],
    ['u4', 'u5'],
    ['u6'],
    ['u7','u8','u9','u10','u11'],
    ['u12','u13','u14']
  ];
  const expectations = [
    function(m,p){return m === null && p.length === 3;},
    function(m,p){return m.players.length === 4 && p.length === 1},
    function(m,p){return m === null && p.length === 2},
    function(m,p){return m.players.length === 4 && p.length === 3},
    function(m,p){return m.players.length === 4 && p.length === 2}
  ];

  function requestMatches(next){
    if(userToAdd.length > 0){
      const u = userToAdd.shift() , e = expectations.shift();
      repository.requestMatch(
              u,
              function(m,p){
                if(!e(m,p)){
                  throw new Error('expectation failed for ' + JSON.stringify(m) + ' / ' + JSON.stringify(p) + ': ' + e);
                }
                requestMatches(next);
              }
      )
    } else {
      next();
    }
  }

  // cancel pending requests
  function cancelPendingRequests(expectedNum,next){
    repository.getPendingRequests(function (users) {
      if(users.length !== expectedNum){throw new Error('unexpeted pending requests: ' + JSON.stringify(users) + ' / was : ' + expectedNum)}
      if(users.length > 0) {
        const r = users.shift().name;
        repository.cancelRequest(r, function(users){
          cancelPendingRequests(expectedNum-1 , next);
        });
      } else {
        next();
      }
    });
  }

  function checkMatches(activeNum, waitingNum, next) {
    repository.getActiveMatch(function(active){
      if(activeNum != active instanceof Object) throw new Error('unexpected active match: ' + JSON.stringify(active) + " / expected: " + activeNum);
      repository.getWaitingMatches(function(w){
        if(waitingNum != w.length) throw new Error('unexpected waiting matches');
        next();
      });
    });
  }

  // cancel pending matches
  function cancelWaitingTestMatches(next){
    repository.getWaitingMatches(function(w){
      function cancelrequest(match,callback){
        if(match) {
          repository.endMatch(match,function(){
            cancelrequest(w.pop(),callback);
          })
        } else {
          checkMatches(1,0,callback);
        }
      }
      cancelrequest(w.pop(),next);
    })
  }

  repository.getPendingRequests(function(users){
    if(users.length !== 0){
      throw new Error('unexpected mongodb state: '+ JSON.stringify(users));
    }
    requestMatches(
            function(){
              logger.log('########### matches requested!');
              checkMatches(1,2,function(){
                cancelPendingRequests(2,function(){

                  logger.log('########### cancelling old matches');
                  // this shouldn't actually cancel a match!
                  repository.endMatch({startDate : {$lt :new Date(new Date() -3600000)}},function(){

                    logger.log('########### cancelling waiting matches');
                    cancelWaitingTestMatches(function(){
                      repository.getActiveMatch(function(m){
                        logger.log('########### cancelling active match');
                        repository.endMatch(m,function(){
                          checkMatches(0,0,fun);
                        })
                      })
                    });
                  })
                });
              });
            }
    )
  });

}

/*
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
 */
