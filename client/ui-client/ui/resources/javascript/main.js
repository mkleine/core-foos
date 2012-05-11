/**
 * Main JS file of core-foos webapp.
 */

var statusFreeText = "frei";
var statusOccupiedText = "besetzt";
var statusWaitingText = "wartend";

const model = Object.create(null);

// init
$(function () {
  coreFoosClient.registerHandler(EVENT_INITIAL_STATE, receiveInitialState);

  coreFoosClient.registerHandler(EVENT_UPDATE_STATE, updateClientState);

  initUi();
});

function initUserName(defaultName) {
  // read Name from cookie
  var userName = $.cookie('core_foos_user_name');
  if(userName) {
    console.log("user name read from cookie: " + userName);
  } else {
    userName = window.prompt('Gib Deinen Namen ein (wird gespeichert):', defaultName) || defaultName;
    if(userName != defaultName) {
      console.log("storing user name in cookie: " + userName);
      $.cookie('core_foos_user_name', userName, { expires : 1000});
    }
  }
  model.userName = userName;
}

function receiveInitialState(data){
  if(!(model.initialized ^= true)) {
    console.error('ILLEGAL STATE: cannot re-apply initial state!');
    // we're initialized, maybe the server was restarted?
    window.location.reload();
    return;
  }

  initUserName(data.user_name);

  model.activeMatch = data.active_match;
  model.waitingMatches = data.waiting_matches;
  setWaitingPlayers(data.waiting_players);

  updateActiveMatchContainer();

  var matches = model.waitingMatches || [];
  console.log("received waiting matches: "+JSON.stringify(matches));
  $.each(matches,function(index,match){
    addReadOnlyQueueEntry(match._id, [match.player1, match.player2, match.player3, match.player4], match.requestDate);
  });

  updateStatusView();
}

function isOldRequest(user) {
  return 1 < (new Date() // now
          - new Date(user.requestDate)) / 3600000;
}

function setWaitingPlayers(waitingPlayers) {
  if(waitingPlayers){
    model.waitingPlayers = waitingPlayers;

    if(waitingPlayers.length > 0) {

      $("#playerNames").empty();
      waitingPlayers.every(function(player, index){
        var playerNameElem = $("<span />").text(player.name);
        if(player.name == model.userName || isOldRequest(player)) {
          playerNameElem.css('cursor','pointer').click(function(){
            console.log('canceling request for user ' + player.name);
            coreFoosClient.cancelRequest(player.name, function(data){
              console.log("match request canceled");
              updateClientState(data);
            });
          })
        }
        if(index > 0) {
          $("<span>, </span>").appendTo($("#playerNames"));
        }
        playerNameElem.appendTo($("#playerNames"));
        return true;
      });

      $("#playerNames").stop().css("opacity", 1).fadeIn(200);

    } else {
      $("#playerNames").fadeOut(500);
    }
  }
}

function updateClientState(data){
  if(data){
    if(data.upsert){
      const match = data.upsert;
      console.log('applying changes to match '+JSON.stringify(match));
      if(match.startDate){
        // upserting active match
        updateActiveMatch(match);
      } else {
        // upserting waiting match
        model.waitingMatches.push(match);
        addReadOnlyQueueEntry(match._id, [match.player1, match.player2, match.player3, match.player4], match.requestDate);
      }
    }

    removeMatch(data.remove);

    setWaitingPlayers(data.waiting_players);

    updateStatusView();

  } else {
    console.warn("ignoring empty state update");
  }
}

function removeMatch(toRemove){
  if(toRemove){
    if(model.activeMatch && model.activeMatch._id == toRemove._id) {
       if(model.waitingMatches.length > 0){
         throw new Error('illegal state: cannot remove active match when there are still waiting matches. Use upsert instead!');
       }

      console.log("removing active match ",toRemove);
      model.activeMatch = null;
      $("#currentMatch_"+toRemove._id).fadeOut(500, function() {
        $(this).remove();
        updateTimer(new Date());
      });

    } else {
      removeWaitingMatch(toRemove);
    }
  }
}

function removeWaitingMatch(toRemove){
  if(toRemove){
    const oldLength = model.waitingMatches.length;
    model.waitingMatches = model.waitingMatches.filter(function(match){
      return match._id != toRemove._id;
    });
    if(oldLength > model.waitingMatches.length){
      console.log('removing match from queue: ' + JSON.stringify(toRemove));
      $("#queueEntry_"+toRemove._id).fadeOut(500, function() {
        $(this).remove();
      });
    }
  }
}

function updateActiveMatch(started){
  if(started) {
    var updateLater = false;
    removeWaitingMatch(started);
    if(model.activeMatch) {
      const oldId = model.activeMatch._id;
      const oldMatchEntry = $("#currentMatch_"+oldId);
      model.activeMatch = started;

      if(oldMatchEntry.length > 0){

        updateLater = true;
        console.info("removing old active match: " + oldId);
        oldMatchEntry.fadeOut(500, function() {
          $(this).remove();
          updateActiveMatchContainer();
        });
      } else {
        console.warn("INCONSITENT STATE: active match was set but not rendered");
      }
    }

    model.activeMatch = started;
    if(!updateLater){
      updateActiveMatchContainer();
    }
  }
}

function updateActiveMatchContainer(){
  var match = model.activeMatch;
  if(match){
    console.log('updating container for active match: '+JSON.stringify(match));

    updateTimer(new Date(match.startDate));

    const players = [match.player1, match.player2, match.player3, match.player4];

    $("#currentMatchContainer").empty();
    const currentMatchId = 'currentMatch_' + match._id;
    $('<div id="' + currentMatchId + '" class="queueEntry"></div>').appendTo('#currentMatchContainer');

    const currentMatchSelector = '#' + currentMatchId;
    $('<div class="queueRemoveEntryButton"></div>').appendTo(currentMatchSelector);


    players.every(function(val,index){
      addPlayerContainer(index + 1, currentMatchSelector, val);
      return true;
    });

    dateAndTimeString = createDateTimeString('gestartet', match.startDate);
    $('<div class="queueDateContainer">'+dateAndTimeString+'</div>').appendTo(currentMatchSelector);

    $("#currentMatchContainer .queueRemoveEntryButton").click(createRemoveMatchHandler(match._id));

    checkCurrentPlayerActive(players);

  }
}

function createDateTimeString(prefixString, rawDateString){
  var date = new Date(rawDateString);
  var dateAndTimeString = prefixString + ' ';
  if(date.getDate() != new Date().getDate()) {
    dateAndTimeString += 'am '+date.getDate()+'.'+(date.getMonth()+1) + ' ';
  }
  dateAndTimeString += 'um '+ date.toLocaleTimeString().substring(0,5);
  return dateAndTimeString;
}

function createRemoveMatchHandler(matchId){
  return function(e){
    console.log('remove match from queue button clicked: ' + matchId);
    coreFoosClient.endMatch(matchId, function(data){
      console.log("match "+ matchId + " removed: " + JSON.stringify(data));
      updateClientState(data);
    });
  }
}

function addReadOnlyQueueEntry(matchId, playerArray, createDate) {
  const queueEntryId = "queueEntry_"+matchId;
  const queueEntrySelector = "#" + queueEntryId;
  $('<div id="' + queueEntryId + '" class="queueEntry"></div>').appendTo('#queueContainer');
  $('<div class="queueRemoveEntryButton"></div>').appendTo(queueEntrySelector);

  $(queueEntrySelector + " .queueRemoveEntryButton").click(createRemoveMatchHandler(matchId));

  addPlayerContainer(1, queueEntrySelector, playerArray[0]);
  addPlayerContainer(2, queueEntrySelector, playerArray[1]);
  addPlayerContainer(3, queueEntrySelector, playerArray[2]);
  addPlayerContainer(4, queueEntrySelector, playerArray[3]);

  var a = createDateTimeString('erstellt',createDate);
  $('<div class="queueDateContainer">' + a + '</div>').appendTo(queueEntrySelector);
}

function addPlayerContainer(playerNumber, rootQueueEntryContainerId, playerName) {

  $('<div class="queuePlayerContainer ' + playerNumber + 'Player"></div>').appendTo(rootQueueEntryContainerId);
  $('<div class="queuePlayerImage active"></div>').appendTo(rootQueueEntryContainerId + ' .queuePlayerContainer.' + playerNumber + 'Player');
  $('<div class="queuePlayerName"><input type="text" value="' + playerName + '" disabled></div>').appendTo(rootQueueEntryContainerId + ' .queuePlayerContainer.' + playerNumber + 'Player');

}

function initUi() {
  const queueAddEntryButton = $("#queueCreationContainer .queueAddEntryButton");
  const images = [
    $("#queueEntry_creation .queuePlayerContainer.1Player .queuePlayerImage"),
    $("#queueEntry_creation .queuePlayerContainer.2Player .queuePlayerImage"),
    $("#queueEntry_creation .queuePlayerContainer.3Player .queuePlayerImage"),
    $("#queueEntry_creation .queuePlayerContainer.4Player .queuePlayerImage")
  ];

  const inputs = [
    $("#queueEntry_creation .queuePlayerContainer.1Player .queuePlayerName input"),
    $("#queueEntry_creation .queuePlayerContainer.2Player .queuePlayerName input"),
    $("#queueEntry_creation .queuePlayerContainer.3Player .queuePlayerName input"),
    $("#queueEntry_creation .queuePlayerContainer.4Player .queuePlayerName input")
  ];

  $("#queueEntry_creation .queueRemoveEntryButton").click(function() {
    $("#queueCreationEntry").attr("class", "queueEntry");
    $("#queueEntry_creation").attr("class", "queueEntry invisible");
  });

  const queueBookingButton = $("#queueEntry_creation .bookingButton");
  queueBookingButton.attr("class", "bookingButton active");

  // toggle buttons hover
  queueAddEntryButton.hover(function () {
            queueAddEntryButton.toggleClass("active");
          }
  );

  queueAddEntryButton.click(function () {
    $("#queueCreationEntry").attr("class", "queueEntry invisible");
    $("#queueEntry_creation").attr("class", "queueEntry");
  });

  images.every(function(val,index){
    togglePlayerImage(val,inputs[index]);
    return true;
  });

  $("#quickRequestCompleteMatch").text("Wir sind komplett!").click(function(){
    if(notMatchActiveOrWaiting()) {
      coreFoosClient.registerMatch([model.userName, model.userName, model.userName, model.userName], updateClientState);
    } else {
      console.info("already registered");
    }
  });

  $("#quickRequestMatch").text("Ich will spielen!").click(function(){
    if(mayRequestMatch()) {
      coreFoosClient.registerMatch([model.userName], updateClientState);
    } else {
      console.log('already registered!');
    }
  });

  // add booking button click function
  queueBookingButton.click(function () {
    const filteredPlayers = [];
    inputs.every(function(name){
      var val = name.val();
      if(val && (val = val.trim()) && val.length > 0){
        filteredPlayers.push(val);
      }
      return true;
    });
    coreFoosClient.registerMatch(filteredPlayers, function(data){
      resetMatchCreationContainer(images, inputs);
      updateClientState(data);
    });

  });
}

function noRequestPending() {
  return model.waitingPlayers.every(function (player) {
    return player.name != model.userName;
  });
}
function notMatchActiveOrWaiting() {
  return model.waitingMatches.concat(model.activeMatch).every(function (match) {
    return !match || (match.player1 != model.userName && match.player2 != model.userName && match.player3 != model.userName && match.player4 != model.userName);
  });
}
/**
 * The current User may request a match only if he's not listed in any request queue or currently active
 * @return {Boolean}
 */
function mayRequestMatch() {
  return noRequestPending() &&
          notMatchActiveOrWaiting();
}

function checkCurrentPlayerActive(players){
  if(players && players.indexOf(model.userName) > -1) {
    if(rooster) {
      rooster.play();
    }
    alert("Kickern, jetzt!");
  }
}

function resetMatchCreationContainer(images, inputs){
  $("#queueCreationEntry").attr("class", "queueEntry ");
  $("#queueEntry_creation").attr("class", "queueEntry invisible");

  images.every(function(val,index){
    val.attr("class", "queuePlayerImage");
    inputs[index].val("");
    return true;
  });
}

function togglePlayerImage(playerImageContainer, playerInputContainer) {

  playerImageContainer.hover(function () {
    playerImageContainer.toggleClass("hover")
  });

  playerImageContainer.click(function () {
    playerImageContainer.attr("class", "queuePlayerImage active");
    if (playerInputContainer.val() == "") {
      playerInputContainer.val(model.userName);
    }
  });
  // toggle playerImage
  playerInputContainer.bind("propertychange keyup input paste", function (event) {
    if (playerInputContainer.val() != "") {
      playerImageContainer.attr("class", "queuePlayerImage active");
    }
    else {
      playerImageContainer.attr("class", "queuePlayerImage");
    }
  });
}

function updateStatusView() {
  const queueSize = model.waitingMatches.length;
  const isTableOccupied = model.activeMatch != null;

  const cls = isTableOccupied ? 'statusOccupied' : (queueSize == 0 ? 'statusFree' : 'statusWaiting');
  $("#statusView").attr('class', cls);

  const txt = isTableOccupied ? statusOccupiedText : (queueSize == 0 ? statusFreeText : statusWaitingText);
  $("#statusView").text(txt);

  $("#queueSizeValue").text(model.waitingMatches.length);
  $("#playersQueueSizeValue").text(model.waitingPlayers.length);
}
