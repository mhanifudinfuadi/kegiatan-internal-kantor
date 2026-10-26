const fs=require('fs');
const s=fs.readFileSync('app/talks-showcase/page.tsx','utf8');
console.log(s.slice(s.length-200));
