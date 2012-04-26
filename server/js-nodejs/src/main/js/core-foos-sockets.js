var http = require('http');
var socketIO = require('socket.io');
var static = require('node-static');
var repository = require('./core-foos-server');

var clientFiles = new static.Server('./client');
repository.initialize();

console.log("Ready to listen");

var httpServer = http.createServer(function(request, response) {
  request.addListener('end', function () {
    clientFiles.serve(request, response);
  });
});
httpServer.listen(2000);

var webSocket = socketIO.listen(httpServer);
webSocket.on('connection', function(client) {
  client.emit("message", 'Welcome to Core Foo Kicker App');
  client.on('enter', function(user) {
    repository.requestPlay(user);
    client.emit("message", user + ' has entered the play zone.');
    // client.broadcast.emit("enter", user);
    // client.emit("enter", user);
    updateUserList(client);
    return;
  });

  client.on('leave', function(user) {
    repository.cancelPlay(user);
    client.emit("message", user + ' has left the building.');
    client.broadcast.emit("leave", user);
    client.emit("leave", user);
    return;
  });
});

function updateUserList(client) {

  repository.getListOfUsers(function(users){
    client.broadcast.emit("list", users);
    client.emit("list", users);
  }
  );
}