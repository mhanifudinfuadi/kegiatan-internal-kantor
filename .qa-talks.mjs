export default async function run(page, ui) {
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    const stage = document.querySelector('.controls')?.previousElementSibling;
    const track = stage ? stage.querySelector('div:nth-child(3)') : null;
    return {
      cards: cards.length,
      stageRect: stage ? { w: stage.clientWidth, h: stage.clientHeight } : null,
      trackWidth: track ? track.getBoundingClientRect().width : null,
      trackTop: track ? track.style.top : null,
      firstCardRect: cards[0] ? (() => { const r = cards[0].getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      photos: cards.slice(0, 40).map((c) => {
        const p = c.querySelector('.photo');
        return p ? { bg: (p.style.backgroundImage || '').slice(0, 70), clip: p.style.clipPath, opacity: p.style.opacity } : null;
      }),
      titles: cards.slice(0, 40).map((c) => c.querySelector('h2')?.textContent),
      transform: track ? track.style.transform : null,
    };
  });
  await page.screenshot({ path: '.qa-talks-1.png', fullPage: false });
  await page.waitForTimeout(3000);
  const later = await page.evaluate(() => {
    const stage = document.querySelector('.controls')?.previousElementSibling;
    const track = stage ? stage.querySelector('div:nth-child(3)') : null;
    return { transform: track ? track.style.transform : null, cards: document.querySelectorAll('.card').length };
  });
  return { data, later };
}
