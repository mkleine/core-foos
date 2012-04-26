package com.coremedia.core_foos {
import io.Socket;
import io.connect;

import js.HTMLElement;

/**
 * A CoreFoo client
 */
public class CoreFoos {

  private var url:String;
  private var element:HTMLElement;

  private const REQUEST_CHECKTABLESTATE:String = "check_table_state";
  private const RESPONSE_CHECKTABLESTATE:String = "table_state";

  private const OCCUPIED_KEY:String = "occupied";


  public static function main(url:String, elementId:String)  : void {

    var element:HTMLElement = window.document.getElementById(elementId) as HTMLElement;
    if( element == null ) {
      throw new Error("Unknown element "+elementId);
    }
    new CoreFoos(url, element);
  }


  public function CoreFoos(url:String, element:HTMLElement) {
    this.url = url;
    this.element = element;
    log("Using url "+url);
    checkTableStateSocketIO();
    //checkTableStateWebsocket();
  }

  private function checkTableStateSocketIO() : void {

    var ws:Socket = connect(url);
    ws.on('connect', function():void
    {
      log("connected to "+url+" using socket.io");

      ws.emit(REQUEST_CHECKTABLESTATE);
    });


    ws.on(RESPONSE_CHECKTABLESTATE, function(obj:Object):void {

      var occupied:Boolean = obj[OCCUPIED_KEY];
      log("Received "+RESPONSE_CHECKTABLESTATE);

      //window.alert("Table is "+(occupied ? "occupied" : "available"));
      element.setAttribute("class", (occupied ? "status_occupied" : "status_available"));
      //log("disconnecting ...");
      //ws.disconnect();
    });

    ws.on('disconnect', function():void {
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