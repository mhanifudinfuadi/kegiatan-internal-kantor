const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const i=html.indexOf('--ph-big');
if(i>=0) console.log(html.slice(i, i+200));
else console.log('none');
