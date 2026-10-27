"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";

function collectPhotosFromData(data) {
  var units = data && data.units ? data.units : [];
  var items = [];
  for (var u = 0; u < units.length; u++) {
    var unit = units[u];
    var kegiatan = unit.kegiatan || [];
    for (var k = 0; k < kegiatan.length; k++) {
      var keg = kegiatan[k];
      var fotos = keg.foto || [];
      if (fotos.length > 0) {
        for (var i = 0; i < fotos.length; i++) {
          items.push({
            id: (keg.id || u + "-" + k) + "-" + i,
            title: keg.judul || "Dokumentasi",
            date: keg.tanggal || "",
            unit: unit.nama || unit.slug || "",
            src: fotos[i],
            tag: (unit.nama || "Dokumentasi").toUpperCase()
          });
        }
      }
    }
  }
  return items;
}

export default function TalksShowcasePage() {
  var [items, setItems] = useState([]);
  var trackRef = useRef(null);
  var stageRef = useRef(null);

  useEffect(function() {
    var mounted = true;
    async function load() {
      try {
        var res = await fetch("/api/preview-photos", { cache: "no-store" });
        if (!res.ok) return;
        var json = await res.json();
        if (mounted) {
          var collected = collectPhotosFromData(json);
          if (collected.length > 0) setItems(collected);
        }
      } catch (e) {}
    }
    load();
    var iv = setInterval(load, 15000);
    return function() { mounted = false; clearInterval(iv); };
  }, []);

  useEffect(function() {
    if (items.length === 0) return;
    var track = trackRef.current;
    var stage = stageRef.current;
    if (!track || !stage) return;
    track.innerHTML = '';
    var original = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var card = document.createElement('article');
      card.className = 'card';
      var glyphs = '';
      for (var g = 0; g < 130; g++) {
        glyphs += '<span></span>';
      }
      card.innerHTML = '<div class="chip"></div><div class="photo-wrap"><div class="photo" style="background-image:url(' + it.src.replace(/'/g, "\\'") + ')"></div></div><div class="glyphs">' + glyphs + '</div><div class="info"><div class="tag">' + (i+1).toString().padStart(2,'0') + ' / ' + it.tag + '</div><h2>' + it.title.replace(/</g,'&lt;') + '</h2><p>' + it.unit + ' • ' + it.date + '</p></div>';
      track.appendChild(card);
      original.push(card);
    }
    for (var c = 0; c < original.length; c++) {
      track.appendChild(original[c].cloneNode(true));
    }
    var cards = Array.prototype.slice.call(track.querySelectorAll('.card'));
    var codeChars = '桜光夢風雲龍水火空心和道未来電脳夜花月雪京炎鋼刃森海星風景あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    for (var ci = 0; ci < cards.length; ci++) {
      if (!cards[ci].querySelector('.scan-edge')) {
        var edge = document.createElement('span');
        edge.className = 'scan-edge';
        cards[ci].appendChild(edge);
      }
      var spans = cards[ci].querySelectorAll('.glyphs span');
      for (var si = 0; si < spans.length; si++) {
        spans[si].textContent = codeChars[Math.floor(Math.random() * codeChars.length)];
      }
    }
    var speed = 55, paused = false, last = 0, offset = 0, hover = false;
    function cardWidth() { return cards[0] ? cards[0].getBoundingClientRect().width : 280; }
    function gapSize() { var st = getComputedStyle(track); return parseFloat(st.gap) || 40; }
    function loopWidth() { return original.length * (cardWidth() + gapSize()); }
    stage.addEventListener('pointerenter', function(){ hover = true; });
    stage.addEventListener('pointerleave', function(){ hover = false; });
    var toggleBtn = document.getElementById('toggle');
    var slowerBtn = document.getElementById('slower');
    var fasterBtn = document.getElementById('faster');
    var speedEl = document.getElementById('speed');
    if (toggleBtn) toggleBtn.onclick = function(){ paused = !paused; toggleBtn.textContent = paused ? 'Lanjutkan animasi' : 'Jeda animasi'; if (!paused) last = 0; };
    if (slowerBtn) slowerBtn.onclick = function(){ speed = Math.max(15, speed - 10); if (speedEl) speedEl.textContent = speed + ' px/detik'; };
    if (fasterBtn) fasterBtn.onclick = function(){ speed = Math.min(100, speed + 10); if (speedEl) speedEl.textContent = speed + ' px/detik'; };
    function frame(t) {
      if (!last) last = t;
      var dt = Math.min((t - last) / 1000, 0.04);
      last = t;
      if (!paused) {
        offset -= speed * (hover ? 0.35 : 1) * dt;
        var lw = loopWidth();
        if (offset <= -lw) offset += lw;
        track.style.transform = 'translate3d(' + offset + 'px,-50%,0)';
      }
      var beamX = stage.getBoundingClientRect().left + stage.clientWidth * 0.5;
      for (var k = 0; k < cards.length; k++) {
        var card = cards[k];
        var rect = card.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1, (beamX - rect.left) / rect.width));
        var photo = card.querySelector('.photo');
        photo.style.clipPath = 'inset(0 ' + ((1-progress) * 100) + '% 0 0)';
        photo.style.opacity = String(0.95 - progress * 0.15);
        var edgeEl = card.querySelector('.scan-edge');
        edgeEl.style.left = (progress * 100) + '%';
        edgeEl.style.opacity = (progress > 0.01 && progress < 0.99) ? '1' : '0';
        var glyphSpans = card.querySelectorAll('.glyphs span');
        for (var gs = 0; gs < glyphSpans.length; gs++) {
          var col = gs % 10;
          var threshold = progress * 10;
          var scanned = col < threshold;
          glyphSpans[gs].style.color = scanned ? 'rgba(255,224,239,.72)' : 'rgba(242,155,189,.14)';
          if (col >= threshold - 0.7 && col < threshold + 0.8 && progress > 0 && progress < 1) {
            glyphSpans[gs].style.textShadow = '0 0 10px rgba(255,190,218,.98), 0 0 20px rgba(242,155,189,.6)';
          } else {
            glyphSpans[gs].style.textShadow = 'none';
          }
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function(){};
  }, [items]);

  useEffect(function() {
    var root = document.getElementById('petals');
    if (!root) return;
    root.innerHTML = '';
    for (var i = 0; i < 18; i++) {
      var petal = document.createElement('i');
      petal.className = 'petal';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.top = (-Math.random() * 600) + 'px';
      petal.style.animationDuration = (6 + Math.random() * 12) + 's';
      petal.style.animationDelay = (-Math.random() * 16) + 's';
      petal.style.opacity = (0.2 + Math.random() * 0.6);
      root.appendChild(petal);
    }
  }, []);

  return (
    <main style={{ margin: 0, color: "#fbeef4", fontFamily: "'Noto Sans JP',system-ui,sans-serif", backgroundImage: "linear-gradient(rgba(16,11,18,0.75), rgba(12,8,13,0.85)), url('/bg-japanese-romance.jpg'), radial-gradient(ellipse at 50% 20%,rgba(160,66,112,.24),transparent 45%)", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <AudioPlayer />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Shippori+Mincho:wght@400;500;600&display=swap" rel="stylesheet" />
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "26px clamp(20px,6vw,88px)", backdropFilter: "blur(12px)", background: "linear-gradient(180deg,rgba(36,22,34,0.6) 0%, transparent 100%)", borderBottom: "1px solid rgba(255,208,224,.16)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 50% 28%,#fff 0 8%,#ffd0e0 9% 20%,transparent 22%),radial-gradient(circle at 28% 56%,#f29bbd 0 22%,transparent 24%),radial-gradient(circle at 72% 56%,#d45e98 0 22%,transparent 24%)", filter: "drop-shadow(0 0 12px #f29bbd88)" }}></div>
          <span>SAKURA / 活動記録</span>
        </div>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link href="/" style={{ color: "#ffd0e0", textDecoration: "none", border: "1px solid rgba(242,155,189,.6)", borderRadius: 999, padding: "9px 16px", fontSize: 11, letterSpacing: ".18em", backdropFilter: "blur(8px)", background: "rgba(36,22,34,0.4)" }}>BERANDA</Link>
          <Link href="/dokumentasi" style={{ color: "#ffd0e0", textDecoration: "none", border: "1px solid rgba(242,155,189,.6)", borderRadius: 999, padding: "9px 16px", fontSize: 11, letterSpacing: ".18em", backdropFilter: "blur(8px)", background: "rgba(36,22,34,0.4)" }}>DOKUMENTASI</Link>
        </nav>
      </header>
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "52px 24px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: ".28em", color: "#f29bbd", textTransform: "uppercase" }}>ROMANCE · JAPANESE CYBER VIBE</div>
        <h1 style={{ font: "400 clamp(36px,5.2vw,64px)/1.08 'Shippori Mincho',serif", margin: "14px auto 16px", maxWidth: 880 }}>Setiap kegiatan, <span style={{ color: "#ffc5dc", fontStyle: "italic" }}>terungkap oleh cahaya sakura.</span></h1>
        <p style={{ color: "#d9b5c6", maxWidth: 720, margin: "0 auto", lineHeight: 1.9, fontSize: 15 }}>Foto mengalir penuh dari kanan. Saat melewati garis pemindai, momen itu terurai menjadi aksara Jepang yang berkilau, menyisakan jejak kenangan yang abadi.</p>
      </section>
      <section ref={stageRef} style={{ position: "relative", height: "clamp(400px,58vw,560px)", margin: "28px 0 0", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3, background: "linear-gradient(90deg,rgba(12,8,13,0.9) 0%,transparent 16%,transparent 84%,rgba(12,8,13,0.9) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3, background: "radial-gradient(ellipse at center,transparent 38%,rgba(8,5,9,0.25) 100%)" }} />
        <div ref={trackRef} style={{ position: "absolute", left: 0, top: "50%", height: "clamp(340px,48vw,440px)", transform: "translateY(-50%)", display: "flex", gap: 40, willChange: "transform" }} />
        <div style={{ position: "absolute", zIndex: 5, top: "50%", left: "50%", height: "clamp(340px,48vw,440px)", width: 2, transform: "translate(-50%,-50%)", pointerEvents: "none", background: "linear-gradient(180deg,transparent,rgba(255,208,224,.8) 10%,#fff 50%,rgba(255,208,224,.8) 90%,transparent)", boxShadow: "0 0 12px 4px #ffd0e0,0 0 40px 16px #ff8dbd99,0 0 120px 28px #ff8dbd44" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 220, transform: "translateX(-50%)", background: "linear-gradient(90deg,transparent,rgba(255,134,190,.08) 40%,rgba(255,174,211,.2) 50%,rgba(255,134,190,.08) 60%,transparent)", filter: "blur(10px)" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 14, height: 14, borderRadius: "50%", transform: "translate(-50%,-50%)", background: "#fff", boxShadow: "0 0 14px 6px #fff,0 0 36px 16px #ff9fc8" }} />
        </div>
        <div id="petals" className="petals" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 6, overflow: "hidden" }} />
      </section>
      <div className="controls" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", padding: "18px 20px 36px", position: "relative", zIndex: 9 }}>
        <button className="ctrl" id="toggle" style={{ border: "1px solid rgba(242,155,189,.7)", background: "linear-gradient(90deg,rgba(66,34,55,0.8),rgba(36,22,34,0.8))", color: "#fbeef4", padding: "10px 18px", borderRadius: 999, fontSize: 12, letterSpacing: ".12em", cursor: "pointer", backdropFilter: "blur(10px)" }}>Jeda animasi</button>
        <button className="ctrl" id="slower" style={{ border: "1px solid rgba(242,155,189,.5)", background: "rgba(36,22,34,0.6)", color: "#fbeef4", padding: "10px 18px", borderRadius: 999, fontSize: 12, letterSpacing: ".12em", cursor: "pointer", backdropFilter: "blur(10px)" }}>Perlambat</button>
        <button className="ctrl" id="faster" style={{ border: "1px solid rgba(242,155,189,.5)", background: "rgba(36,22,34,0.6)", color: "#fbeef4", padding: "10px 18px", borderRadius: 999, fontSize: 12, letterSpacing: ".12em", cursor: "pointer", backdropFilter: "blur(10px)" }}>Percepat</button>
        <span className="speed" id="speed" style={{ color: "#ffd0e0", minWidth: 90, fontSize: 11, textAlign: "center", letterSpacing: ".16em" }}>55 px/detik</span>
      </div>
      <style>{`
        .card{position:relative;flex:0 0 clamp(260px,28vw,340px);height:100%;overflow:hidden;border:1px solid rgba(255,208,224,.28);border-radius:26px;background:radial-gradient(circle at top,rgba(242,155,189,.18),transparent 55%),#140f16;box-shadow:0 40px 90px -40px rgba(242,155,189,.4),0 0 0 1px rgba(255,255,255,.02) inset;isolation:isolate}
        .chip{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 14px,rgba(242,155,189,.06) 15px 16px),repeating-linear-gradient(90deg,transparent 0 20px,rgba(242,155,189,.08) 21px 22px),radial-gradient(circle at 50% 0,rgba(255,208,224,.12),transparent 60%),linear-gradient(160deg,#2a1926,#120b12 80%);z-index:0}
        .photo-wrap{position:absolute;inset:0;overflow:hidden;z-index:1}
        .photo{position:absolute;inset:-2%;width:104%;height:104%;background-size:cover;background-position:center;filter:saturate(.92) contrast(1.02);clip-path:inset(0 0 0 0);will-change:clip-path,opacity}
        .photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,8,13,.02) 20%,rgba(12,8,13,.9) 100%)}
        .glyphs{position:absolute;inset:0;z-index:2;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(13,1fr);padding:14px;gap:1px;pointer-events:none;mask-image:linear-gradient(90deg,#000 0%,#000 70%,transparent 100%)}
        .glyphs span{font-size:clamp(11px,1.3vw,16px);color:#f29bbd20;text-align:center;align-self:center;transition:color .22s ease,text-shadow .22s ease;font-family:'Noto Sans JP',sans-serif}
        .scan-edge{position:absolute;top:0;bottom:0;width:44px;z-index:3;pointer-events:none;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(255,208,224,.55),rgba(255,134,190,.24),transparent);filter:blur(5px);will-change:left,opacity}
        .info{position:absolute;z-index:4;left:26px;right:26px;bottom:26px;text-shadow:0 4px 16px #000}
        .tag{font-size:10px;letter-spacing:.24em;color:#ffc3da;text-transform:uppercase}
        .info h2{font:400 24px/1.26 'Shippori Mincho',serif;margin:10px 0 6px}
        .info p{font-size:11px;color:#e7c9d8;margin:0;letter-spacing:.08em}
        .petal{position:absolute;width:8px;height:12px;border-radius:80% 0 80% 0;background:radial-gradient(circle,#ffd0e0 0%,#f29bbd77 70%);filter:blur(.4px);animation:fall linear infinite}
        @keyframes fall{from{transform:translate3d(0,-40px,0) rotate(0)}to{transform:translate3d(80px,620px,0) rotate(360deg)}}
        @media(max-width:600px){.card{flex-basis:240px;border-radius:22px}.info{left:18px;bottom:18px}.info h2{font-size:20px}.glyphs{padding:10px}}
      `}</style>
    </main>
  );
}
