const form = document.querySelector('#calc');
const widthInput = document.querySelector('#w');
const heightInput = document.querySelector('#h');
const quantityInput = document.querySelector('#q');
const finishInput = document.querySelector('#finish');
const error = document.querySelector('#calc-error');
const price = document.querySelector('#price');
const areaLabel = document.querySelector('#area');
const unitLabel = document.querySelector('#unit');
const copyButton = document.querySelector('#copy');
const feedback = document.querySelector('#copy-feedback');
const money = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
const decimal = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 3});

function readCalculation() {
  const width = Number(widthInput.value);
  const height = Number(heightInput.value);
  const quantity = Number(quantityInput.value);
  const rate = Number(finishInput.value);
  const valid = [width, height, quantity, rate].every(Number.isFinite) && width > 0 && height > 0 && Number.isSafeInteger(quantity) && quantity > 0 && width <= 10000 && height <= 10000 && quantity <= 1000000;
  for (const input of [widthInput, heightInput, quantityInput]) input.setAttribute('aria-invalid', String(!valid && (!input.value || Number(input.value) <= 0 || (input === quantityInput && !Number.isInteger(Number(input.value))))));
  error.hidden = valid;
  copyButton.disabled = !valid;
  if (!valid) { price.textContent = '—'; areaLabel.textContent = 'Área total: —'; unitLabel.textContent = 'Por unidade: —'; return null; }
  const area = width * height * quantity / 10000;
  const total = area * rate;
  if (!Number.isFinite(total)) return null;
  price.textContent = money.format(total);
  areaLabel.textContent = `Área total: ${decimal.format(area)} m²`;
  unitLabel.textContent = `Aproximadamente ${money.format(total / quantity)} por unidade`;
  return { width, height, quantity, area, total, finish: finishInput.options[finishInput.selectedIndex].text };
}

form.addEventListener('input', () => { feedback.textContent = ''; readCalculation(); });
form.addEventListener('change', readCalculation);
form.addEventListener('submit', event => event.preventDefault());
copyButton.addEventListener('click', async () => {
  const result = readCalculation();
  if (!result) return;
  const summary = `Olá! Gostaria de solicitar um orçamento na Central do Adesivo.\nMedidas: ${decimal.format(result.width)} cm × ${decimal.format(result.height)} cm\nQuantidade: ${decimal.format(result.quantity)} unidades\nAcabamento: ${result.finish}\nÁrea total estimada: ${decimal.format(result.area)} m²\nSimulação inicial: ${money.format(result.total)}\nEntendo que o valor final depende da análise do projeto.`;
  try { await navigator.clipboard.writeText(summary); feedback.textContent = 'Simulação copiada. Cole a mensagem no atendimento.'; }
  catch { feedback.textContent = 'Não foi possível copiar automaticamente. Confira os dados acima.'; }
});
readCalculation();

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#menu');
menuButton.addEventListener('click', () => { const open = menu.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
menu.addEventListener('click', event => { if (event.target.closest('a')) { menu.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Abrir menu'); } });

document.querySelectorAll('.icon-orb').forEach(orb => {
  const dotCount = 14;
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('span');
    dot.className = 'icon-dot';
    dot.style.setProperty('--angle', `${(360 / dotCount) * i}deg`);
    dot.style.setProperty('--delay', `${(i % 7) * 0.25}s`);
    orb.appendChild(dot);
  }
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.getBoundingClientRect().width || canvas.width;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, size };
}

function rotateY(p, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
}

function rotateX(p, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
}

function project(p, size, focal) {
  const scale = focal / (focal + p.z);
  return { x: size / 2 + p.x * scale, y: size / 2 + p.y * scale, scale };
}

function initOrb(canvas) {
  const { ctx, size } = setupCanvas(canvas);
  const focal = size * 0.9;
  const radius = size * 0.32;
  const count = 170;
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
    points.push({
      x: radius * Math.sin(inclination) * Math.cos(azimuth),
      y: radius * Math.sin(inclination) * Math.sin(azimuth),
      z: radius * Math.cos(inclination)
    });
  }
  let angle = 0;
  function draw() {
    ctx.clearRect(0, 0, size, size);
    const tilted = points.map(p => rotateX(p, 0.35));
    const rotated = tilted.map(p => rotateY(p, angle));
    rotated.sort((a, b) => a.z - b.z);
    for (const p of rotated) {
      const proj = project(p, size, focal);
      const depth = (p.z + radius) / (radius * 2);
      const r = 1.1 + depth * 2.1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,219,8,${0.25 + depth * 0.75})`;
      ctx.shadowColor = '#ffdb08';
      ctx.shadowBlur = 6 * depth;
      ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  draw();
  if (reduceMotion) return;
  function loop() { angle += 0.0032; draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
}

function initGlueDrop(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.width, h = rect.height || canvas.height;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const focal = Math.max(w, h) * 1.1;
  const R = Math.min(w, h) * 0.32;
  const H = h * 0.62;
  const profile = [[0, 0.03], [0.15, 0.2], [0.35, 0.46], [0.55, 0.66], [0.75, 0.7], [0.9, 0.44], [1, 0.06]];
  function radiusAt(t) {
    for (let i = 0; i < profile.length - 1; i++) {
      const [t0, r0] = profile[i], [t1, r1] = profile[i + 1];
      if (t >= t0 && t <= t1) { const f = (t - t0) / (t1 - t0); return R * (r0 + (r1 - r0) * f); }
    }
    return 0;
  }
  const rings = 12, segs = 16;
  const mesh = [];
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const y = -H / 2 + t * H;
    const r = radiusAt(t);
    const ring = [];
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      ring.push({ x: r * Math.cos(a), y, z: r * Math.sin(a) });
    }
    mesh.push(ring);
  }
  let angle = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const projected = mesh.map(ring => ring.map(p => project(rotateY(rotateX(p, 0.1), angle), Math.max(w, h), focal)));
    ctx.lineWidth = 1;
    ctx.shadowColor = '#ffdb08';
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < segs; j++) {
        const p1 = projected[i][j], p2 = projected[i][(j + 1) % segs];
        const depth = (p1.scale + p2.scale) / 2;
        ctx.strokeStyle = `rgba(255,219,8,${0.15 + (depth - 0.7) * 1.4})`;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.moveTo(p1.x - (Math.max(w, h) - w) / 2, p1.y - (Math.max(w, h) - h) / 2);
        ctx.lineTo(p2.x - (Math.max(w, h) - w) / 2, p2.y - (Math.max(w, h) - h) / 2);
        ctx.stroke();
        if (i < rings - 1) {
          const p3 = projected[i + 1][j];
          ctx.beginPath();
          ctx.moveTo(p1.x - (Math.max(w, h) - w) / 2, p1.y - (Math.max(w, h) - h) / 2);
          ctx.lineTo(p3.x - (Math.max(w, h) - w) / 2, p3.y - (Math.max(w, h) - h) / 2);
          ctx.stroke();
        }
      }
    }
    for (const ring of projected) {
      for (const p of ring) {
        const depth = p.scale;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,219,8,${0.3 + (depth - 0.7) * 1.6})`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x - (Math.max(w, h) - w) / 2, p.y - (Math.max(w, h) - h) / 2, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  draw();
  if (reduceMotion) return;
  function loop() { angle += 0.0026; draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
}

const orbCanvas = document.querySelector('#orbCanvas');
if (orbCanvas) initOrb(orbCanvas);
const glueCanvas = document.querySelector('#glueCanvas');
if (glueCanvas) initGlueDrop(glueCanvas);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}
