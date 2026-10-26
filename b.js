const fs=require('fs');
const s=fs.readFileSync('app/talks-showcase/page.tsx','utf8');
const i=s.indexOf('GESER');
if(i>=0) console.log(s.slice(i-40,i+60));
else console.log('no');
