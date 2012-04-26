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

  queueAddEntryButton.hover(function () {
            queueAddEntryButton.toggleClass("active")
          }
  );
  queueRemoveEntryButton.hover(function () {
            queueRemoveEntryButton.toggleClass("active")
          }
  );
}
function initStatusView(queueSize) {

  if (queueSize == 0 && IS_TABLE_FREE == true) {
    $("#statusView").attr('class', "statusFree");
    $("#statusView").text(statusFreeText);
  }
  else if (queueSize >= 1 && IS_TABLE_FREE == true) {
    $("#statusView").attr('class', "statusWaiting");
    $("#statusView").text(statusWaitingText);
  }
  else if (queueSize >= 1 && IS_TABLE_FREE == false) {
    $("#statusView").attr('class', "statusOccupied");
    $("#statusView").text(statusOccupiedText);
  }
}

function toggleBooking() {
  if ($("#bookingButton").val() == buttonAddBookingText) {
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