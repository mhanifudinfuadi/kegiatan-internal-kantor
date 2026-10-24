const fs = require('fs');
const s = fs.readFileSync('C:/temp/kp2.html','utf8');
const i = s.indexOf('scan');
if(i>=0) console.log(s.slice(Math.max(0,i-60), i+100));
else console.log('none');
