const fs=require('fs');
const s=fs.readFileSync('preview dokumentasi.html','utf8');
console.log(s.slice(200,400));
