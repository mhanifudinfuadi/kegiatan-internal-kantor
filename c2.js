const fs=require('fs');
const s=fs.readFileSync('C:/temp/kp3.html','utf8');
const i=s.indexOf('card-stream');
if(i>=0) console.log(s.slice(i-20,i+80));
else console.log('none');
