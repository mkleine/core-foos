var idleTimeInMinutes = 0;

window.setInterval(
        function(){
          idleTimeInMinutes++;
          $("#timeValue").text(idleTimeInMinutes);
        },
        1000*60
);

function updateTimer(date) {
  console.log("updating timer with date "+date );
  // TODO why do we get 'Invalid Date' here?
  if(date && date != "Invalid Date") {
    var now = new Date();
    var idleTimeInMillis = now.getTime() - date.getTime();
    idleTimeInMinutes = Math.round(idleTimeInMillis/60000);
  } else {
    log.error("got invalid date!");
  }
  $("#statusCounter").css('display', 'inline-block');
  $("#timeValue").text(idleTimeInMinutes);
}