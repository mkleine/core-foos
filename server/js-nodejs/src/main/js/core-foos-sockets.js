var http = require('http');
var socketIO = require('socket.io');
var static = require('node-static');
var repository = require('./core-foos-server');

var config;
try {
    config = JSON.parse(process.argv[2]);
} catch (e) {
    config = {dir:'./client'};
    console.warn("cannot parse config: " + e);
    console.log("falling back to default config");
}
console.log("config:");
console.dir(config);

var clientFiles = new static.Server(config.dir);
repository.initialize(config);

console.log("Ready to listen");

var httpServer = http.createServer(function (request, response) {
    request.addListener('end', function () {
        clientFiles.serve(request, response);
    });
});
httpServer.listen(2000);

var webSocket = socketIO.listen(httpServer);


webSocket.on('connection', function (client) {
    client.emit("message", 'Welcome to Core Foo Kicker App');
    client.on('register', function (data) {

        repository.requestPlay(data, function (match) {
            console.log("maybe start a match with " + JSON.stringify(match));
            if (match) {
                console.log("start match");
                client.broadcast.emit("start_match", match);
                client.emit("start_match", match);
            }
            client.emit('registration_complete');
        });
        return;
    });

    client.on('leave', function (user) {
        repository.cancelPlay(user);
        client.emit("message", user + ' has left the building.');
        client.broadcast.emit("leave", user);
        client.emit("leave", user);
        return;
    });

    client.on('check_table_state', function () {
        getTableState(client);
        return;
    });

  client.on('current_match', function() {
    repository.currentMatch(function (match) {
    client.emit('current_match', match);
    return;
  })});

    client.on('end_match', function (data) {
        repository.endMatch(data.matchId, function (match) {
            if (match) {
                client.broadcast.emit("start_match", match);
                client.emit("start_match", match);
            }
        });
        return;
    });

    client.on('get_list_of_users', function () {
        repository.getListOfUsers(function (res) {
            client.emit('list_of_users', res);
            console.log('LIST OF USERS:' + JSON.stringify(res));
        });
        return;
    });

  client.on('waiting_matches', function () {
      /*
    repository.getNumberOfMatches(function (res) {
      client.emit('waiting_matches', res);
    });
    */
      repository.getListOfMatches(function (res) {
           client.emit('waiting_matches', res);
         });

    return;
  });
});

function getTableState(client) {
    repository.getNumberOfActiveMatches(function (count) {
            if (count == 0) {
                client.broadcast.emit("table_state", {occupied:false});
                client.emit("table_state", {occupied:false});
            } else {
                client.broadcast.emit("table_state", {occupied:true});
                client.emit("table_state", {occupied:true});
            }
        }
    );
}
