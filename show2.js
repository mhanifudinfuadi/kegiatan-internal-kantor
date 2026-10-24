const fs = require('fs');
const s = fs.readFileSync('C:/temp/kp2.html','utf8');
const i = s.indexOf('card-scanner-container');
if(i>=0) console.log(s.slice(i, i+400));
else console.log('none');
