package io {

/**
 * Jangaroo adapter for socket.io (http://socket.io)
 */
public class Socket {

  public native function on(message:String, func:Function):void;

  public native function disconnect():void;

  public native function emit(message:String):void;
}
}