const fs=require('fs');
const s=fs.readFileSync('app/talks-showcase/page.tsx','utf8');
const i=s.indexOf('Data foto');
if(i>=0) console.log(s.slice(i-80,i+40));
else console.log('no');
