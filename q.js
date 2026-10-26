const fs=require('fs');
const html=fs.readFileSync('preview dokumentasi.html','utf8');
const start=html.indexOf('--ph-big:url(');
if(start>=0){
  const end=html.indexOf(');',start);
  console.log(html.slice(start+12,end));
}
