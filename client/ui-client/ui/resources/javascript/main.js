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

var QUEUE_SIZE = 0;
var webSocket;

// init
$(function () {
  initServerConnection();
  checkTableState();

  $("#statusView").text(statusFreeText);
  $("#bookingButton").val(buttonAddBookingText);
  $("#queueSizeValue").text(QUEUE_SIZE);
//  initStatusView(QUEUE_SIZE);
  refreshQueueSize();
  initUi();
});

function initServerConnection() {
  webSocket = io.connect('http://co5pcdv03.coremedia.com:2000');
  webSocket.on('connect', function () {
    alert('Connected to the server.');
  });

  webSocket.on('table_state', function (isTableFree) {
    initStatusView(QUEUE_SIZE, isTableFree);
  });

  webSocket.on('start_match', function(data) {
    alert("Start match with " + JSON.stringify(data));
  });

}

function initUi() {

  var queueAddEntryButton = $("#queueContainer .queueAddEntryButton");
  var queueRemoveEntryButton = $("#queueContainer .queueRemoveEntryButton");
  var queuePlayer1Image = $("#queueEntry_1 .queuePlayerContainer.firstPlayer .queuePlayerImage");
  var queuePlayer2Image = $("#queueEntry_1 .queuePlayerContainer.secondPlayer .queuePlayerImage");
  var queuePlayer3Image = $("#queueEntry_1 .queuePlayerContainer.thirdPlayer .queuePlayerImage");
  var queuePlayer4Image = $("#queueEntry_1 .queuePlayerContainer.fourthPlayer .queuePlayerImage");


  var queuePlayer1Name = $("#queueEntry_1 .queuePlayerContainer.firstPlayer .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_1 .queuePlayerContainer.secondPlayer .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_1 .queuePlayerContainer.thirdPlayer .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_1 .queuePlayerContainer.fourthPlayer .queuePlayerName input");


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
    var players = [{ name: queuePlayer1Name.val()},{ name: queuePlayer2Name.val()},{ name:  queuePlayer3Name.val()}, { name: queuePlayer4Name.val()}];
    toggleBooking(true, players);
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

  var queuePlayer1Name = $("#queueEntry_1 .queuePlayerContainer.firstPlayer .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_1 .queuePlayerContainer.secondPlayer .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_1 .queuePlayerContainer.thirdPlayer .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_1 .queuePlayerContainer.fourthPlayer .queuePlayerName input");

  var queueBookingButton = $("#queueEntry_1 .bookingButton");

  if (queuePlayer1Name.val() != "" && queuePlayer2Name.val() != "" && queuePlayer3Name.val() != "" && queuePlayer4Name.val() != "") {
    queueBookingButton.attr("class", "bookingButton active");
  }
}
function initStatusView(queueSize, isTableFree) {


  if (queueSize == 0 && isTableFree) {
    $("#statusView").attr('class', "statusFree");
    $("#statusView").text(statusFreeText);
  }
  else if (queueSize >= 1 && isTableFree) {
    $("#statusView").attr('class', "statusWaiting");
    $("#statusView").text(statusWaitingText);
  }
  else if (queueSize >= 1 && !isTableFree) {
    $("#statusView").attr('class', "statusOccupied");
    $("#statusView").text(statusOccupiedText);
  }
}

function toggleBooking(bookFlag, players) {
  if (bookFlag) {
    addToQueue();
    webSocket.emit("register", players);
//    checkTableState();
    /* $("#statusView").text(statusOccupiedText);
     $("#statusView").attr('class', "statusOccupied");
     $("#bookingButton").val(buttonRemoveBookingText);*/
  }
  else {
    removeFromQueue();
    if (QUEUE_SIZE == 0) {
      $("#statusView").text(statusFreeText);
      $("#statusView").attr('class', "statusFree");
    }

    $("#bookingButton").val(buttonAddBookingText);
  }
}

function refreshQueueSize() {
  $("#queueSizeValue").text(QUEUE_SIZE);
}

function addToQueue() {
  QUEUE_SIZE++;
  refreshQueueSize();
}

function removeFromQueue() {
  QUEUE_SIZE--;
  refreshQueueSize();
}


function checkTableState() {
  webSocket.emit("check_table_state");
}