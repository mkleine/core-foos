package com.coremedia.core_foos {
import io.Socket;
import io.connect;

import js.HTMLElement;

/**
 * A CoreFoo client
 */
public class CoreFoos {

  private var url:String;
  private var status:HTMLElement;

  private const REQUEST_CHECKTABLESTATE:String = "check_table_state";
  private const REQUEST_REGISTER:String = "register";
  private const REQUEST_LEAVE:String = "leave";
  private const RESPONSE_CHECKTABLESTATE:String = "table_state";

  private const DUMMY_USERS:Object = [{"name":"1"},{"name":"2"},{"name":"3"},{"name":"4"}];
  private var socket:Socket;

  private const OCCUPIED_KEY:String = "occupied";


  public static function main(url:String, statusElementId:String, joinElementId:String,  leaveElementId:String)  : void {

    try {

      var status:HTMLElement = window.document.getElementById(statusElementId) as HTMLElement;
      var join:HTMLElement = window.document.getElementById(joinElementId) as HTMLElement;
      var leave:HTMLElement = window.document.getElementById(leaveElementId) as HTMLElement;
      if( status == null || join == null || leave == null) {
        throw new Error("Unknown element");
      }
      new CoreFoos(url, status, join, leave);
    }
    catch(error:*) {

      window.alert("An error has occurred: "+error);
    }

  }


  public function CoreFoos(url:String, statusElement:HTMLElement, joinElement:HTMLElement, leaveElement:HTMLElement) {
    this.url = url;
    this.status = statusElement;
    initializeSocket();

    joinElement.addEventListener("click", join, false);
    leaveElement.addEventListener("click", leave, false);
    log("Using url "+url);
    //checkTableStateWebsocket();
  }

  private function join() : void {
    log("Joining");
    socket.emit(REQUEST_REGISTER, DUMMY_USERS);
  }

  private function leave() : void {
    log("Leaving");
    socket.emit(REQUEST_LEAVE, DUMMY_USERS);
  }

  private function initializeSocket() : void {


    socket = connect(url);

    socket.on('connect', function():void
    {
      log("connected to "+url+" using socket.io");
      status.setAttribute("class",  "status_connected");

      socket.emit(REQUEST_CHECKTABLESTATE);
    });


    socket.on(RESPONSE_CHECKTABLESTATE, function(obj:Object):void {

      var occupied:Boolean = obj[OCCUPIED_KEY] as Boolean;
      log("Received "+RESPONSE_CHECKTABLESTATE+". Table is occupied: "+occupied);

      //window.alert("Table is "+(occupied ? "occupied" : "available"));
      status.setAttribute("class", (occupied ? "status_occupied" : "status_available"));

      //log("disconnecting ...");
      //ws.disconnect();
    });

    socket.on('disconnect', function():void {
      log("disconnected");
    });
  }


//  private function checkTableStateWebsocket() : void {
//
//
//    var ws:Object = new window.WebSocket(url);
//    ws.onopen = function():void
//    {
//      log("connected to "+url+" using websocket");
//      var tableState:Object = ws.send(REQUEST_CHECKTABLESTATE);
//      log(REQUEST_CHECKTABLESTATE+": "+tableState);
//
//      log("disconnecting ...");
//      ws.close();
//    };
//
//    ws.onmessage = function (evt:Object):void
//    {
//      var msg:String = evt.data;
//      log("Received "+msg+" from "+url);
//    };
//
//    ws.onclose = function():void
//    {
//      // websocket is closed.
//      log("disconnected");
//    };
//
//    log("Created WebSocket: "+dump(ws));
//  }

  private static function log(message:String) :void {
    window.console.log(message);
  }


  /*
  private static function dump(obj:Object, depth:int=0) : String {

    if( depth > 2 ) {
      return "";
    }

    var indent:String = "";
    for( var i:int = 0; i<depth; i++ ) {
      indent += " ";
    }

    var result:String = "";
    for( var key:String in obj ) {
      if( obj.hasOwnProperty(key) ) {

        var value:* = obj[key];
        if( typeof(value) === "object" ) {
          result += "\n"+indent+key+"="+dump(value, depth+1);
        }
        else {
          result += "\n"+indent+key+"="+value;
        }
      }
    }

    return result;
  }
  */
}
}