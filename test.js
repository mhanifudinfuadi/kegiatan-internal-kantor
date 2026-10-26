fetch('http://localhost:3000/api/preview-photos').then(r=>r.json()).then(j=>{console.log(j.units[0].kegiatan[0].foto.length);}).catch(e=>console.log(e.message));
