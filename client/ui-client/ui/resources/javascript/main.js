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

var IS_TABLE_FREE = true;
var QUEUE_SIZE = 0;

// init
$(function () {
  $("#statusView").text(statusFreeText);
  $("#bookingButton").val(buttonAddBookingText);
  $("#queueSizeValue").text(QUEUE_SIZE);
  initStatusView(QUEUE_SIZE);
  refreshQueueSize();
  initUi();
});


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
  queueBookingButton.click(function(){
    toggleBooking(true);
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

function checkPlayerText(){

  var queuePlayer1Name = $("#queueEntry_1 .queuePlayerContainer.firstPlayer .queuePlayerName input");
  var queuePlayer2Name = $("#queueEntry_1 .queuePlayerContainer.secondPlayer .queuePlayerName input");
  var queuePlayer3Name = $("#queueEntry_1 .queuePlayerContainer.thirdPlayer .queuePlayerName input");
  var queuePlayer4Name = $("#queueEntry_1 .queuePlayerContainer.fourthPlayer .queuePlayerName input");

  var queueBookingButton = $("#queueEntry_1 .bookingButton");

  if(queuePlayer1Name.val() != "" && queuePlayer2Name.val() != "" && queuePlayer3Name.val() != "" && queuePlayer4Name.val() != ""){
    queueBookingButton.attr("class", "bookingButton active");
  }
}
function initStatusView(queueSize) {

  if (queueSize == 0 && IS_TABLE_FREE) {
    $("#statusView").attr('class', "statusFree");
    $("#statusView").text(statusFreeText);
  }
  else if (queueSize >= 1 && IS_TABLE_FREE) {
    $("#statusView").attr('class', "statusWaiting");
    $("#statusView").text(statusWaitingText);
  }
  else if (queueSize >= 1 && !IS_TABLE_FREE) {
    $("#statusView").attr('class', "statusOccupied");
    $("#statusView").text(statusOccupiedText);
  }
}

function toggleBooking(bookFlag) {
  if (bookFlag) {
    addToQueue();
    $("#statusView").text(statusOccupiedText);
    $("#statusView").attr('class', "statusOccupied");
    $("#bookingButton").val(buttonRemoveBookingText);
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
