const https = require('https');
const fs = require('fs');
https.get('https://kegiatan-pelayanan087.vercel.app/_next/static/chunks/app/page-4ad8fd77d59eb98b.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('C:/temp/cardscan.js', data);
    const idx = data.indexOf('card-stream');
    if(idx>=0) console.log(data.slice(idx-50, idx+150));
    else console.log('none');
  });
}).on('error', (e) => { console.error(e.message); });
