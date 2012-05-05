var connect = require('connect');
var urlparser = require('url');

var minPwdLenght = 1;

// TODO replace this with some users db
const users = Object.create(null);
users['max'] = {name: 'max', pwd :'max'};

var loginOrRegister = function (req, res, next) {
  url = req.urlp = urlparser.parse(req.url, true);
  console.log('req.body: '+ JSON.stringify(req.body));

  if(url.body) {
    try {
      if( url.body.action == "login") {
        // TODO access user db here
        var user = users[url.body.name];
        if(user && user.pwd === url.body.pwd) {
          console.log(user.name + "logged in");
          req.session.auth = true;
        }
      } else if(url.body.action == "register") {
        const pwds = url.body.pwd;
        if((pwds[0] + "").length >= minPwdLenght && pwds[0] === pwds[1]) {
          const userName = url.body.name;
          // TODO really register user
          users[userName] = {name : userName, pwd : pwds[0]};
          console.log("user " + userName + " registered");
          req.session.auth = true;
        }
      }

      if(req.sesstion.auth) {
        console.log('redirecting to root page');
        res.writeHead(302, {'Location': '/'});
        res.end();
        return;
      }
    } catch(e){
      console.error(e);
    }
  }
  next();
};

var authCheck = function (req, res, next) {
  url = req.urlp = urlparser.parse(req.url, true);

  // ####
  // Logout
  if ( url.pathname == "/logout" ) {
    req.session.destroy();
  }

  // ###
  // Do nothing if user wants to register or to login
  if(['/login.html', '/register.html'].indexOf(url.pathname) > -1
          ||
          (req.body && ['login','register'].indexOf(req.body.action) > -1)
          ) {
    console.log("login or register request detected");
    next();
    return;
  } else {
    console.log("########## " + url.pathname +  (req.body ? " / " + JSON.stringify(req.body) : ""));
  }

  // ####
  // Is User already validated?
  if (req.session && req.session.auth == true) {
    next(); // stop here and pass to the next onion ring of connect
    return;
  }

  console.log('redirecting to login page');
  res.writeHead(302, {'Location': '/login.html'});
  res.end();
  return;


  // ####
  // This user is not authorized.
  res.writeHead(403);
  res.end('You are not authorized.');
  return;
}

var server = connect.createServer(
        connect.logger({ format: ':method :url' }),
        connect.cookieParser("secret"),
        connect.session({ secret: 'foobar' }),
        connect.bodyParser(),
        loginOrRegister,
        authCheck,
        connect.static('../client')
);

server.listen(3000);