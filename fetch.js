const https = require('https');
const fs = require('fs');
https.get('https://kegiatan-pelayanan087.vercel.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('C:/temp/kp3.html', data);
    const idx = data.indexOf('card-scanner');
    if(idx>=0) console.log(data.slice(idx, idx+200));
    else console.log('none');
  });
}).on('error', (e) => { console.error(e.message); });
