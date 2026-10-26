const fs=require('fs');
const data=JSON.parse(fs.readFileSync('data/kegiatan.json','utf8'));
const u=data.units[0];
console.log(u.nama);
console.log(u.kegiatan[0].judul);
console.log(u.kegiatan[0].foto.length);
console.log(u.kegiatan[0].foto[0]);
