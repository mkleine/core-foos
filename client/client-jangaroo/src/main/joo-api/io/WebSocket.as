package io {

/**
 * Jangaroo adapter for socket.io (http://socket.io)
 */
public class WebSocket {

  public native function on(key:String, func:Function):void;

  public native function disconnect():void;

  public native function emit(key:String):void;
}
}