fetch('http://localhost:3000/dokumentasi/lain-lain').then(r=>r.text()).then(t=>{console.log(t.slice(0,80));}).catch(e=>console.log('err'));
