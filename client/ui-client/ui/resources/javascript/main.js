/**
 * Main JS file of core-foos webapp.
 */

var statusFreeText = "frei";
var statusOccupiedText = "besetzt";
var statusWaitingText = "wartend";

var occupied = false;
var queueSize = 0;
var webSocket;
var testIndex = 2;
var currentMatchId;

// init
$(function () {
  initServerConnection();
  checkTableState();

  $("#statusView").text(statusFreeText);
  $("#queueSizeValue").text(queueSize);
  $("#dropUsers").text('dropUsers');
  $("#dropUsers").click(dropUsers);
  $("#dropMatches").text('dropMatches');
  $("#dropMatches").click(dropMatches);
  $("#statusCounter").css('display', 'none');
//  initStatusView(QUEUE_SIZE);
  refreshQueueSize();
  initUi();
});

function initServerConnection() {
  var url = location.href; // TODO maybe alter protocol and cut off path ?
  webSocket = io.connect(url);
  webSocket.on('connect', function () {
    console.log('Connected to: ' + url);
  });

  webSocket.on('last_finished_match',
          function (data) {
            console.log('last_finished_match' + JSON.stringify(data));
            var endDate = new Date(data.lastFinishedMatch.endDate);
            console.log(endDate);
            updateTimer(endDate);
          }
  );

  webSocket.on('current_match',
    receiveCurrentMatch
  );

  webSocket.on('table_state', function (data) {
    setOccupied(data.occupied);
    initStatusView(getQueueSize(), getOccupied());
  });

  webSocket.on('start_match', function (data) {
    console.log("Start match with " + JSON.stringify(data));
    checkTableState();
    if(data.match && data.match.state) {
      addCurrentMatchQueueEntry(0,[data.match.player1, data.match.player2, data.match.player3, data.match.player4], data.match.requestDate);
    }
  });

  webSocket.on('end_match', function (data) {
    $("#currentMatchContainer").empty();
//    console.log("End match with " + JSON.stringify(data));
    checkTableState();
  });

  webSocket.on('waiting_matches', function (data) {
    testIndex = 2;
    setQueueSize(data.length);
    showQueueList(data);
    initStatusView(getQueueSize(), getOccupied());
  });

  webSocket.on('registration_complete', function (data) {
    webSocket.emit("waiting_matches");
    console.log("registering match " + JSON.stringify(data));
  });

  webSocket.on('current_match', function (match) {
    console.log("current match :" + JSON.stringify(match));
    receiveCurrentMatch();
    if(match && match.state) {
      currentMatchId = match._id;
      addCurrentMatchQueueEntry(0,[match.player1, match.player2, match.player3, match.player4], match.requestDate);
    }
  });
}

function showQueueList(matches) {

  $("#queueContainer").empty();
  matches.forEach(function (item) {
    addReadOnlyQueueEntry(testIndex, [item.player1, item.player2, item.player3, item.player4], item.requestDate);
    testIndex++;
  });
}


function addCurrentMatchQueueEntry(number, playerArray, createDate) {
  $("#currentMatchContainer").empty();
  $('<div id="currentMatch_' + number + '" class="queueEntry"></div>').appendTo('#currentMatchContainer');
  $('<div class="queueRemoveEntryButton"></div>').appendTo('#currentMatch_' + number);

  addPlayerContainer(1, '#currentMatch_' + number, playerArray[0]);
  addPlayerContainer(2, '#currentMatch_' + number, playerArray[1]);
  addPlayerContainer(3, '#currentMatch_' + number, playerArray[2]);
  addPlayerContainer(4, '#currentMatch_' + number, playerArray[3]);

  var a =  new Date(createDate).getHours() +":"+new Date(createDate).getMinutes();
  $('<div class="queueDateContainer">erstellt um '+ a+'</div>').appendTo('#currentMatch_' + number);

  var currentMatchRemoveContainer = $("#currentMatchContainer .queueRemoveEntryButton");
  currentMatchRemoveContainer.click(function() {
    endCurrentMatch();
  });
}


function addReadOnlyQueueEntry(number, playerArray, createDate) {
  $('<div id="queueEntry_' + number + '" class="queueEntry"></div>').appendTo('#queueContainer');
  $('<div class="queueRemoveEntryButton"></div>').appendTo('#queueEntry_' + number);

  addPlayerContainer(1, '#queueEntry_' + number, playerArray[0]);
  addPlayerContainer(2, '#queueEntry_' + number, playerArray[1]);
  addPlayerContainer(3, '#queueEntry_' + number, playerArray[2]);
  addPlayerContainer(4, '#queueEntry_' + number, playerArray[3]);

  var a =  new Date(createDate).getHours() +":"+new Date(createDate).getMinutes();
  $('<div class="queueDateContainer">erstellt um '+ a+'</div>').appendTo('#queueEntry_' + number);
}

function addPlayerContainer(playerNumber, rootQueueEntryContainerId, playerName) {

  $('<div class="queuePlayerContainer ' + playerNumber + 'Player"></div>').appendTo(rootQueueEntryContainerId);
  $('<div class="queuePlayerImage active"></div>').appendTo(rootQueueEntryContainerId + ' .queuePlayerContainer.' + playerNumber + 'Player');
  $('<div class="queuePlayerName"><input type="text" value="' + playerName + '" disabled></div>').appendTo(rootQueueEntryContainerId + ' .queuePlayerContainer.' + playerNumber + 'Player');

}

function initUi() {
  var queueAddEntryButton = $("#queueCreationContainer .queueAddEntryButton");
//  var queueRemoveEntryButton = $("#queueContainer .queueRemoveEntryButton");
  var queuePlayer1Image = $("#queueEntry_creation .queuePlayerContainer.1Player .queuePlayerImage");
  var queuePlayer2Image = $("#queueEntry_creation .queuePlayerContainer.2Player .queuePlayerImage");
  var queuePlayer3Image = $("#queueEntry_creation .queuePlayerContainer.3Player .queuePlayerImage");
  var queuePlayer4Image = $("#queueEntry_creation .queuePlayerContainer.4Player .queuePlayerImage");


  var queuePlayer1Name = $("#queueEntry_creation .queuePlayerContainer.1Player .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_creation .queuePlayerContainer.2Player .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_creation .queuePlayerContainer.3Player .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_creation .queuePlayerContainer.4Player .queuePlayerName input");



  var queueBookingButton = $("#queueEntry_creation .bookingButton");

  // toggle buttons hover
  queueAddEntryButton.hover(function () {
            queueAddEntryButton.toggleClass("active");
          }
  );

  queueAddEntryButton.click(function () {
    $("#queueCreationEntry").attr("class", "queueEntry invisible");
    $("#queueEntry_creation").attr("class", "queueEntry");
  });


  /*
   queueRemoveEntryButton.hover(function () {
   queueRemoveEntryButton.toggleClass("active");
   }
   );
   */

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

    $("#queueCreationEntry").attr("class", "queueEntry ");
    $("#queueEntry_creation").attr("class", "queueEntry invisible");
    queuePlayer1Name.val("");
    queuePlayer2Name.val("");
    queuePlayer3Name.val("");
    queuePlayer4Name.val("");

    queuePlayer1Image.attr("class", "queuePlayerImage");
    queuePlayer2Image.attr("class", "queuePlayerImage");
    queuePlayer3Image.attr("class", "queuePlayerImage");
    queuePlayer4Image.attr("class", "queuePlayerImage");
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

  var queuePlayer1Name = $("#queueEntry_creation .queuePlayerContainer.1Player .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_creation .queuePlayerContainer.2Player .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_creation .queuePlayerContainer.3Player .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_creation .queuePlayerContainer.4Player .queuePlayerName input");

  var queueBookingButton = $("#queueEntry_creation .bookingButton");

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

  }
}

function receiveCurrentMatch(data) {
  if(data){
    console.log("Receiving current : "+ JSON.stringify(data));
    updateTimer(new Date(data.startDate));
  } else {
    // this is actually an error
    console.warn("Current match is " + data);
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
  webSocket.emit("administration", "dropUsers");
}

function dropMatches() {
  webSocket.emit("administration", "dropMatches");
}

function endCurrentMatch(){
  webSocket.emit("end_match", "");
}

function playAudio(audioId) {
  var element = document.getElementById(audioId);
  if(element && 'function' == typeof(element.play)){
    element.play();
  } else {
    console.warn("cannot play audio for id "+audioId);
  }
}
