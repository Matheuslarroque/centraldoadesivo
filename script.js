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
