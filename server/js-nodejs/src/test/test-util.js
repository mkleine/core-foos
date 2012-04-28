var u = require('../main/js/lib/core-foos-util');
var util1 = u.createLogger('util_1',3);
var util2 = u.createLogger('util_2',1);
var util3 = u.createLogger('util_3');
util1.log("shouldn't show up");
util1.info("shouldn't show up");
util1.warn("shouldn't show up");
util1.error(new Error('show up!'));
util2.log('2 - do not show up');
util2.info('2 - show up');
util3.log('3 - show up');

var anError = new Error('something went wrong!');
console.error(anError);

