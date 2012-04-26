/**
 * Created by IntelliJ IDEA.
 * User: skrause
 * Date: 26.04.12
 * Time: 14:25
 * To change this template use File | Settings | File Templates.
 */

var statusFreeText = "frei";
var statusOccupiedText = "besetzt";
var statusWaitingText = "wartend";
var buttonRemoveBookingText = "buchung zurückziehen";
var buttonAddBookingText = "buchung";

var occupied = false;
var queueSize = 0;
var webSocket;
var testIndex = 2;
// init
$(function () {
  initServerConnection();
  checkTableState();

  $("#statusView").text(statusFreeText);
  $("#bookingButton").val(buttonAddBookingText);
  $("#queueSizeValue").text(queueSize);
  $("#dropUsers").text('dropUsers');
  $("#dropUsers").click(dropUsers);
  $("#dropMatches").text('dropMatches');
  $("#dropMatches").click(dropMatches);
//  initStatusView(QUEUE_SIZE);
  refreshQueueSize();
  initUi();
});

function initServerConnection() {
  webSocket = io.connect('http://co5pcdv03.coremedia.com:2000');
  webSocket.on('connect', function () {
    alert('Connected to the server.');
  });

  webSocket.on('table_state', function (data) {
    setOccupied(data.occupied);
    initStatusView(getQueueSize(), getOccupied());
  });

  webSocket.on('start_match', function (data) {
//    alert("Start match with " + JSON.stringify(data));
    checkTableState();
  });

  webSocket.on('waiting_matches', function (data) {
    setQueueSize(data.length);
    showQueueList(data);
    initStatusView(getQueueSize(), getOccupied());
  });

  webSocket.on('registration_complete', function (data) {
    alert("register"+data);
  });

}


function showQueueList(matches){

  matches.forEach(function(item){
    addReadOnlyQueueEntry(testIndex);
    testIndex++;
  });
}

function addReadOnlyQueueEntry(number){
  $('<div id="queueEntry_'+number+'" class="queueEntry"></div>').appendTo('#queueContainer');
  $('<div class="queueRemoveEntryButton"></div>').appendTo('#queueEntry_'+number);

  addPlayerContainer(1, '#queueEntry_'+number);
  addPlayerContainer(2, '#queueEntry_'+number);
  addPlayerContainer(3, '#queueEntry_'+number);
  addPlayerContainer(4, '#queueEntry_'+number);
}

function addPlayerContainer(playerNumber, rootQueueEntryContainerId){

  $('<div class="queuePlayerContainer '+playerNumber+'Player"></div>').appendTo(rootQueueEntryContainerId);
  $('<div class="queuePlayerImage active"></div>').appendTo(rootQueueEntryContainerId+' .queuePlayerContainer.'+playerNumber+'Player');
  $('<div class="queuePlayerName"><input type="text" disabled></div>').appendTo(rootQueueEntryContainerId+' .queuePlayerContainer.'+playerNumber+'Player');

}

function initUi() {
//  addReadOnlyQueueEntry(3);
  var queueAddEntryButton = $("#queueContainer .queueAddEntryButton");
  var queueRemoveEntryButton = $("#queueContainer .queueRemoveEntryButton");
  var queuePlayer1Image = $("#queueEntry_1 .queuePlayerContainer.1Player .queuePlayerImage");
  var queuePlayer2Image = $("#queueEntry_1 .queuePlayerContainer.2Player .queuePlayerImage");
  var queuePlayer3Image = $("#queueEntry_1 .queuePlayerContainer.3Player .queuePlayerImage");
  var queuePlayer4Image = $("#queueEntry_1 .queuePlayerContainer.4Player .queuePlayerImage");


  var queuePlayer1Name = $("#queueEntry_1 .queuePlayerContainer.1Player .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_1 .queuePlayerContainer.2Player .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_1 .queuePlayerContainer.3Player .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_1 .queuePlayerContainer.4Player .queuePlayerName input");


  var queueBookingButton = $("#queueEntry_1 .bookingButton");

  // toggle buttons hover
  queueAddEntryButton.hover(function () {
            queueAddEntryButton.toggleClass("active");
          }
  );
  queueRemoveEntryButton.hover(function () {
            queueRemoveEntryButton.toggleClass("active");
          }
  );

  togglePlayerImage(queuePlayer1Image, queuePlayer1Name);
  togglePlayerImage(queuePlayer2Image, queuePlayer2Name);
  togglePlayerImage(queuePlayer3Image, queuePlayer3Name);
  togglePlayerImage(queuePlayer4Image, queuePlayer4Name);


  // add booking button click function
  queueBookingButton.click(function () {
    var players = [
      { name:queuePlayer1Name.val()},
      { name:queuePlayer2Name.val()},
      { name:queuePlayer3Name.val()},
      { name:queuePlayer4Name.val()}
    ];
    var filteredPlayers = new Array();
    for (var i = 0; i < players.length; i++) {
      if (players[i].name && players[i].name.length > 0) {
        filteredPlayers.push(players[i]);
      }
    }
    toggleBooking(true, filteredPlayers);
  });
}

function togglePlayerImage(playerImageContainer, playerInputContainer) {

  playerImageContainer.hover(function () {
    playerImageContainer.toggleClass("hover")
  });

  playerImageContainer.click(function () {
    playerImageContainer.attr("class", "queuePlayerImage active");
    if (playerInputContainer.val() == "") {
      playerInputContainer.val("player");
    }
    checkPlayerText();
  });
  // toggle playerImage
  playerInputContainer.bind("propertychange keyup input paste", function (event) {
    if (playerInputContainer.val() != "") {
      playerImageContainer.attr("class", "queuePlayerImage active");
    }
    else {
      playerImageContainer.attr("class", "queuePlayerImage");
    }
    checkPlayerText();
  });

}

function checkPlayerText() {

  var queuePlayer1Name = $("#queueEntry_1 .queuePlayerContainer.1Player .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_1 .queuePlayerContainer.2Player .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_1 .queuePlayerContainer.3Player .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_1 .queuePlayerContainer.4Player .queuePlayerName input");

  var queueBookingButton = $("#queueEntry_1 .bookingButton");

  if (queuePlayer1Name.val() != "" && queuePlayer2Name.val() != "" && queuePlayer3Name.val() != "" && queuePlayer4Name.val() != "") {
    queueBookingButton.attr("class", "bookingButton active");
  }
}
function initStatusView(queueSize, isTableOccupied) {


  if (getQueueSize() == 0 && !isTableOccupied) {
    $("#statusView").attr('class', "statusFree");
    $("#statusView").text(statusFreeText);
  }
  else if (getQueueSize() == 0 && isTableOccupied) {
    $("#statusView").attr('class', "statusOccupied");
    $("#statusView").text(statusOccupiedText);
  }
  else if (getQueueSize() >= 1 && !isTableOccupied) {
    $("#statusView").attr('class', "statusWaiting");
    $("#statusView").text(statusWaitingText);
  }
  else if (getQueueSize() >= 1 && isTableOccupied) {
    $("#statusView").attr('class', "statusOccupied");
    $("#statusView").text(statusOccupiedText);
  }

  $("#queueSizeValue").text(getQueueSize());
}

function toggleBooking(bookFlag, players) {
  if (bookFlag) {
    webSocket.emit("register", players);
    checkTableState();
  }
  else {
    removeFromQueue();
    if (queueSize == 0) {
      $("#statusView").text(statusFreeText);
      $("#statusView").attr('class', "statusFree");
    }

    $("#bookingButton").val(buttonAddBookingText);
  }
}

function refreshQueueSize() {
  $("#queueSizeValue").text(getQueueSize());
}

function setQueueSize(queueSizeVal) {
  queueSize = queueSizeVal;
}

function getQueueSize() {
  return queueSize;
}

function setOccupied(flag) {
  occupied = flag;
}

function getOccupied() {
  return occupied;
}

function checkTableState() {
  webSocket.emit("check_table_state");
  webSocket.emit("waiting_matches");
}

function dropUsers() {
  webSocket.emit("administration","dropUsers");
}

function dropMatches() {
  webSocket.emit("administration","dropMatches");
}

