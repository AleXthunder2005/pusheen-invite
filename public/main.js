const SUBMIT_URL = "http://localhost:3000/api/rsvp";

const tommy = document.getElementById("tommy");
const scene = document.getElementById("scene");
const speech = document.getElementById("speech");
const choices = document.getElementById("choices");
const decline = document.getElementById("decline");
const openLetter = document.getElementById("open-letter");
const note = document.getElementById("note");
const pages = [...document.querySelectorAll(".page")];
const nag = document.getElementById("nag");
const nagText = document.getElementById("nag-text");
const love = document.getElementById("love");
const form = document.getElementById("plans");

const NAGS = [
  "Ты наверное не туда жмал",
  "Нажми Да пожалуйста",
  "Ну пожалуйста)",
];

const noClicks = { date: 0, place: 0 };
let finished = false;

function startMusic() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || startMusic.ctx) return;
  const ctx = new AudioCtx();
  startMusic.ctx = ctx;

  const master = ctx.createGain();
  master.gain.value = 0.16;
  const soft = ctx.createBiquadFilter();
  soft.type = "lowpass";
  soft.frequency.value = 1800;
  master.connect(soft);
  soft.connect(ctx.destination);

  const melody = [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 523.25, 698.46, 880, 783.99, 587.33, 523.25, 659.25, 783.99, 1046.5];
  const step = 0.62;
  let index = 0;
  let next = ctx.currentTime + 0.2;

  const tone = (freq, when, dur, vol) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(vol, when + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  };

  const schedule = () => {
    const horizon = ctx.currentTime + 1.8;
    while (next < horizon) {
      const freq = melody[index % melody.length];
      tone(freq, next, 0.9, 0.11);
      if (index % 4 === 0) tone(freq / 2, next, 2.2, 0.045);
      next += step;
      index += 1;
    }
  };

  schedule();
  setInterval(schedule, 600);
  ctx.resume().catch(() => {});
}

function hopToPusheen() {
  const narrow = window.innerWidth < 800;
  const from = narrow ? 58 : 74;
  const to = narrow ? 40 : 44;
  const duration = 4000;
  const t0 = performance.now();
  tommy.classList.add("is-hopping");

  function frame(now) {
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 2);
    tommy.style.left = `${from + (to - from) * eased}%`;
    if (p < 1) {
      requestAnimationFrame(frame);
      return;
    }
    tommy.classList.remove("is-hopping");
    speech.classList.add("show");
    setTimeout(() => choices.classList.add("show"), 350);
  }

  requestAnimationFrame(frame);
}

const jumps = [
  [-100, 0],
  [0, -100],
  [100, 0],
  [0, 100],
];
let jumpIndex = 0;

function dodge(event) {
  event.preventDefault();
  event.stopPropagation();
  const [x, y] = jumps[jumpIndex % jumps.length];
  jumpIndex += 1;
  decline.style.transform = `translate(${x}px, ${y}px)`;
}

decline.addEventListener("pointerdown", dodge);
decline.addEventListener("click", dodge);

function showPage(index) {
  pages.forEach((page, i) => {
    page.hidden = i !== index;
  });
  nag.classList.remove("open");
}

openLetter.addEventListener("click", () => {
  tommy.style.left = "";
  scene.classList.add("aside");
  note.classList.add("open");
  showPage(0);
});

document.getElementById("next").addEventListener("click", () => showPage(1));

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => showPage(0));
});

function onNo(key, button) {
  const line = NAGS[noClicks[key]] || NAGS[NAGS.length - 1];
  noClicks[key] += 1;
  nagText.textContent = line;
  nag.classList.add("open");
  if (noClicks[key] >= NAGS.length) {
    button.remove();
  }
}

document.getElementById("no-date").addEventListener("click", (event) => {
  onNo("date", event.currentTarget);
});

document.getElementById("yes-date").addEventListener("click", () => showPage(2));

document.getElementById("no-place").addEventListener("click", (event) => {
  onNo("place", event.currentTarget);
});

document.getElementById("yes-place").addEventListener("click", () => showPage(3));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (finished) return;
  finished = true;

  const data = {
    outfit: document.getElementById("outfit").value,
    wishes: document.getElementById("wishes").value,
  };

  fetch(SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(data),
  }).catch(() => {});

  love.classList.add("open");
  scene.classList.add("aside");
  note.classList.add("open");
});

startMusic();
window.addEventListener("pointerdown", () => {
  if (!startMusic.ctx) startMusic();
  else startMusic.ctx.resume().catch(() => {});
});

hopToPusheen();
