const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const r=/data-idx="[0-9]+"/g;
let m,c=0;
while((m=r.exec(html))!==null)c++;
console.log(c);
