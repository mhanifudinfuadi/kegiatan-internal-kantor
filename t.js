const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const idx=html.indexOf('background-image:var(--ph-big)');
console.log(idx);
if(idx>=0) console.log(html.slice(idx, idx+120));
