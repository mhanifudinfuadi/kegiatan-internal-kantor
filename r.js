const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const r=/--ph-big:url\((data:[^)]+)\)/g;
let m,c=0;
while((m=r.exec(html))!==null){c++; if(c<2) console.log(m[1].substring(0,40));}
console.log('c',c);
