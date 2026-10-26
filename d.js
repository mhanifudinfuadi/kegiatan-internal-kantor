const fs=require('fs');
const s=fs.readFileSync('app/talks-showcase/page.tsx','utf8');
const idx=s.lastIndexOf('</main>');
if(idx>=0){
  const before=s.slice(0,idx);
  const after=s.slice(idx);
  const add=`      <div className="controls" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap",padding:"10px 20px 30px",position:"relative",zIndex:9}}><button className="ctrl" id="toggle" style={{border:"1px solid #f29bbd55",background:"#241622",color:"#fbeef4",padding:"10px 16px",borderRadius:999,fontSize:12,cursor:"pointer"}}>Jeda animasi</button><button className="ctrl" id="slower" style={{border:"1px solid #f29bbd55",background:"#241622",color:"#fbeef4",padding:"10px 16px",borderRadius:999,fontSize:12,cursor:"pointer"}}>Perlambat</button><button className="ctrl" id="faster" style={{border:"1px solid #f29bbd55",background:"#241622",color:"#fbeef4",padding:"10px 16px",borderRadius:999,fontSize:12,cursor:"pointer"}}>Percepat</button><span className="speed" id="speed" style={{color:"#ffd0e0",minWidth:90,fontSize:11,textAlign:"center"}}>55 px/detik</span></div>\n      <script dangerouslySetInnerHTML={{__html:"let spd=55,paused=false;const tg=document.getElementById('toggle'),sl=document.getElementById('slower'),fs=document.getElementById('faster'),sv=document.getElementById('speed');if(tg){tg.onclick=()=>{paused=!paused;tg.textContent=paused?'Lanjutkan animasi':'Jeda animasi';};}if(sl){sl.onclick=()=>{spd=Math.max(15,spd-10);if(sv)sv.textContent=spd+' px/detik';};}if(fs){fs.onclick=()=>{spd=Math.min(100,spd+10);if(sv)sv.textContent=spd+' px/detik';};}"}} />\n`;
  fs.writeFileSync('app/talks-showcase/page.tsx', before+add+after);
  console.log('ok');
}
else console.log('no');
