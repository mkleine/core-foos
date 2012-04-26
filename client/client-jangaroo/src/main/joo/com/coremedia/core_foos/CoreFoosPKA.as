package com.coremedia.core_foos {

/**
 * PKA's test code
 */
public class CoreFoosPKA {

  public static function main(url:String)  : void {
    new CoreFoosPKA(url);
  }

  private var url:String;

  public function CoreFoosPKA(url:String) {
    this.url = url;
    log("Using url "+url);
    checkTableStateSocketIO();
  }

  private function checkTableStateSocketIO() : void {

    var ws:Object = window.io.connect(url);
    ws.on('connect', function():void
    {
      log("connected to "+url+" using socket.io");

      var tableState:Object = ws.emit('check_table_state');
      log("check_table_state: "+dump(tableState));

      log("disconnecting ...");
      ws.disconnect();
    });

    ws.on('disconnect', function():void {
      log("disconnected");
    });

  }

  private function checkTableStateWebsocket() : void {


    var ws:Object = new window.WebSocket("ws://localhost:2000");
    ws.onopen = function():void
    {
      log("connected to "+url+" using websocket");
      var tableState:Object = ws.send('check_table_state');
      log("check_table_state: "+tableState);

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