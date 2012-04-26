package com.coremedia.core_foos {

/**
 * PKA's test code
 */
public class CoreFoosPKA {

  private var url:String;
  private const REQUEST_CHECKTABLESTATE:String = "check_table_state";
  private const RESPONSE_CHECKTABLESTATE:String = "table_state";

  public static function main(url:String)  : void {
    new CoreFoosPKA(url);
  }



  public function CoreFoosPKA(url:String) {
    this.url = url;
    log("Using url "+url);
    checkTableStateSocketIO();
    //checkTableStateWebsocket();
  }

  private function checkTableStateSocketIO() : void {

    var ws:Object = window.io.connect(url);
    ws.on('connect', function():void
    {
      log("connected to "+url+" using socket.io");

      var tableState:Object = ws.emit(REQUEST_CHECKTABLESTATE);
      log(REQUEST_CHECKTABLESTATE+": "+dump(tableState));

      log("disconnecting ...");
      ws.disconnect();
    });


    ws.on('message', function():void {
      log("")
    });

    ws.on('disconnect', function():void {
      log("disconnected");
    });

  }

  private function checkTableStateWebsocket() : void {


    var ws:Object = new window.WebSocket(url);
    ws.onopen = function():void
    {
      log("connected to "+url+" using websocket");
      var tableState:Object = ws.send(REQUEST_CHECKTABLESTATE);
      log(REQUEST_CHECKTABLESTATE+": "+tableState);

      log("disconnecting ...");
      ws.close();
    };

    ws.onmessage = function (evt:Object):void
    {
      var msg:String = evt.data;
      log("Received "+msg+" from "+url);
    };

    ws.onclose = function():void
    {
      // websocket is closed.
      log("disconnected");
    };

    log("Created WebSocket: "+dump(ws));
  }

  private static function log(message:String) :void {
    window.console.log(message);
  }



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
}
}