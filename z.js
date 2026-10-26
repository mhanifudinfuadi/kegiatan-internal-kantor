const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const r=/background-image:var\(--ph-big\)[^;]+/g;
let m,c=0;
while((m=r.exec(html))!==null){c++; console.log(m[0].substring(0,60));}
console.log('t',c);
