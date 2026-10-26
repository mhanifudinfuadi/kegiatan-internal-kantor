const fs=require('fs');
const p='C:/GitHub/kegiatan-internal-kantor/app/talks-showcase/page.tsx';
const s=fs.readFileSync(p,'utf8');
console.log(s.includes('<style jsx'));
console.log(s.includes('getUnits'));
