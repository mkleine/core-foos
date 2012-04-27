/**
 * Main JS file of core-foos mobile webapp.
 */

const url = 'http://co5pcdv03.coremedia.com:2000';

var statusFreeText = "frei";
var statusOccupiedText = "besetzt";
var statusWaitingText = "wartend";
var buttonAddBookingText = "buchung";

var occupied = false;
var queueSize = 0;
var webSocket;
var testIndex = 2;

var endCurrentMatchButtonClicked = false;

// init
$(function () {
  initServerConnection();
  checkTableState();

  $("#statusView").text(statusFreeText);
  //$("#bookingButton").val(buttonAddBookingText);
  $("#queueSizeValue").text(queueSize);
  $("#statusCounter").css('display','none');
  refreshQueueSize();
  initUi();
});

function initServerConnection() {
  webSocket = io.connect(url);
  webSocket.on('connect', function () {
    console.log('Connected to: ' + url);
  });

  webSocket.on('receive_time',
          function(data) {
            console.log("Receiving time: "+ JSON.stringify(data));
            $("#statusCounter").css('display','inline-block');
          }
  )

  webSocket.on('table_state', function (data) {
    setOccupied(data.occupied);
    initStatusView(getQueueSize(), getOccupied());
  });

  webSocket.on('start_match', function (data) {
    console.log("Start match with " + JSON.stringify(data));
    checkTableState();
  });


  webSocket.on('end_match', function (data) {
    console.log("End match with " + JSON.stringify(data));
    checkTableState();
  });

  webSocket.on('waiting_matches', function (data) {
    setQueueSize(data.length);
    initStatusView(getQueueSize(), getOccupied());
  });

  webSocket.on('registration_complete', function (data) {
    console.log("registering match "+data);
  });

  webSocket.on('current_match', function (match) {
    if (endCurrentMatchButtonClicked) {
      webSocket.emit("end_match", {matchId:match._id});
      endCurrentMatchButtonClicked = false;
    }
  });
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

function initUi() {
  prepareButtonEndMatch();
  prepareButtonBookQuickMatch();
}

function prepareButtonEndMatch() {
  $("#btnEndCurrentMatch").click(endCurrentKickerMatch);
}

function endCurrentKickerMatch() {
  endCurrentMatchButtonClicked = true;
  webSocket.emit("current_match"); // see 'initServerConnection()' for processing of server response
  alert("end the match!");
}

function prepareButtonBookQuickMatch() {
  $("#btnQuickBook").click(quickBookMatch);
}

function quickBookMatch() {
  alert("quick book match!");
}

