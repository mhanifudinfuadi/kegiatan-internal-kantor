const https = require('https');
const fs = require('fs');
https.get('https://kegiatan-pelayanan087.vercel.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('C:/temp/kp2.html', data);
    console.log(data.length);
    const m = data.match(/scan|carousel|card/gi);
    console.log(m ? m.length : 0);
  });
}).on('error', (e) => { console.error(e.message); });
