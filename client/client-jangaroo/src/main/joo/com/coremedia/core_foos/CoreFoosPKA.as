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
      log("connected to "+url);

      var tableState:Object = ws.emit('check_table_state');
      log("check_table_state: "+tableState);

      log("disconnecting ...");
      ws.disconnect();
    });

    ws.on('disconnect', function():void {
      log("disconnected");
    });

  }

  private function checkTableStateWebsocket() : void {


//    var ws:Object = window.io.connect(url); //new window.WebSocket("ws://localhost:2000");
//    ws.onopen = function():void
//    {
//      window.alert("Open");
//      // Web Socket is connected, send data using send()
//      ws.send("Message to send");
//    };
//
//    ws.onmessage = function (evt:Object):void
//    {
//      var msg:String = evt.data;
//      window.alert("Message is received...");
//    };
//    ws.onclose = function():void
//    {
//      // websocket is closed.
//      window.alert("Connection is closed...");
//    };
//
//
//    window.alert("Ok1: "+ws+" "+url);
//    ws.emit("check_table_state");
//    window.alert("Ok2: "+ws);
  }

  private static function log(message:String) :void {
    window.console.log(message);
  }
}
}