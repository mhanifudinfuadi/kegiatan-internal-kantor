const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const r=/.cell[^\{]+\{[^\}]*background[^;]+;[^\}]*\}/g;
let m,c=0;
while((m=r.exec(html))!==null){c++; if(c<3) console.log(m[0].substring(0,80));}
console.log('total',c);
