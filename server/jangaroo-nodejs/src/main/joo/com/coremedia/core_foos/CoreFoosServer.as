package com.coremedia.core_foos {

import joo.debug;

public class CoreFoosServer {

  public static function main(options:Object):void {
    var http = require('http');
    http.createServer(function (req, res) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello World\n');
    }).listen(1337, '127.0.0.1');
    trace('Server running at http://127.0.0.1:1337/');
  }

}
}
