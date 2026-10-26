const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const r=/url\((data:image\/[^)]+)\)/g;
let m,c=0;
while((m=r.exec(html))!==null)c++;
console.log(c);
