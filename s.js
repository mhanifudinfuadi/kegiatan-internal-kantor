const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const r=/\.bg\{[^}]*url\([^)]+\)[^}]*\}/g;
let m,c=0;
while((m=r.exec(html))!==null){c++; console.log(m[0].substring(0,70));}
console.log(c);
