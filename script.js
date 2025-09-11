let totalDrinks = 0;
let goalAnnounced = false;
let firstTotalClick = true;

let confettiActive = false;
let confettiParticles = [];
let confettiCtx;
let confettiAnimation;

function initConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  confettiCtx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

function startConfetti() {
  if (confettiActive) return;
  confettiActive = true;
  confettiParticles = [];

  const colors = ["#ff0", "#f0f", "#0ff", "#0f0", "#f00", "#00f", "#ffa500"];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      r: Math.random() * 6 + 4,
      d: Math.random() * 0.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    });
  }

  (function animate() {
    confettiAnimation = requestAnimationFrame(animate);
    drawConfetti();
  })();
}

function stopConfetti() {
  confettiActive = false;
  cancelAnimationFrame(confettiAnimation);
  if (confettiCtx)
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawConfetti() {
  if (!confettiCtx) return;
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  confettiParticles.forEach((p) => {
    p.tiltAngle += p.tiltAngleIncrement;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.x += Math.sin(p.d);
    p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 15;

    if (p.y > window.innerHeight) {
      p.y = -10;
      p.x = Math.random() * window.innerWidth;
    }

    confettiCtx.beginPath();
    confettiCtx.lineWidth = p.r;
    confettiCtx.strokeStyle = p.color;
    confettiCtx.moveTo(p.x + p.tilt + p.r / 4, p.y);
    confettiCtx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
    confettiCtx.stroke();
  });
}

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const scoreOf = (person) =>
  parseInt(person.querySelector(".number")?.textContent) || 0;

const MAX_NAME_LEN = 20;

const MAX_TOTAL_LEN = 3;

function computeTotals() {
  const people = $$(".person");
  const scores = people.map(scoreOf);
  const sum = scores.reduce((a, b) => a + b, 0);
  return { people, scores, sum, total: totalDrinks };
}

function setPersonFill(person, percent) {
  person.style.setProperty("--fill", `${percent}%`);
}

function updateProgressComputed(people, scores, total) {
  people.forEach((person, i) => {
    const percent = total > 0 ? (scores[i] / total) * 100 : 0;
    setPersonFill(person, percent);
  });
}

function checkTotalReached(sum, total) {
  const reached = total > 0 && sum >= total;

  if (reached && !goalAnnounced) {
    goalAnnounced = true;

    const s = document.getElementById("beerWin");
    if (s) {
      s.currentTime = 0;
      s.play().catch(() => {});
    }

    document.getElementById("totalProgress")?.classList.add("goalFlash");
    $$(".plusBtn").forEach((b) => (b.disabled = true));

    startConfetti();
  }

  if (!reached && goalAnnounced) {
    goalAnnounced = false;
    document.getElementById("totalProgress")?.classList.remove("goalFlash");
    $$(".plusBtn").forEach((b) => (b.disabled = false));

    stopConfetti();
  }
}

function updateTotalProgressComputed(sum, total) {
  const totalBar = document.getElementById("totalProgress");
  const label = document.getElementById("totalProgressLabel");
  if (totalBar) {
    const percent = total > 0 ? (sum / total) * 100 : 0;
    totalBar.style.setProperty("--fill", `${percent}%`);
  }
  if (firstTotalClick) {
    if (label) label.textContent = `Total: (click to edit)`;
  } else {
    if (label) label.textContent = `Total: ${sum} / ${total}`;
  }
}

function updateBeerMugComputed(sum, total) {
  const mug = document.getElementById("beerMug");
  if (!mug) return;

  if (total <= 0) {
    mug.src = "beers/beer1.png";
    mug.classList.remove("shaking");
    mug.style.removeProperty("--amp");
    mug.style.removeProperty("--dur");
    return;
  }

  const frames = 48;
  const percent = Math.max(0, Math.min(1, sum / total));
  const fullness = Math.min(frames, Math.max(1, Math.round(percent * frames)));
  mug.src = `beers/beer${fullness}.png`;

  const minAmp = 1;
  const maxAmp = 8;
  const amp = minAmp + (maxAmp - minAmp) * percent;

  const maxSpeed = 0.25;
  const minSpeed = 0.9;
  const dur = minSpeed - (minSpeed - maxSpeed) * percent;

  mug.style.setProperty("--amp", `${amp}deg`);
  mug.style.setProperty("--dur", `${dur}s`);
  mug.classList.toggle("shaking", percent > 0 && shakeEnabled);
}

function ensureRow(person) {
  if (
    person.parentElement &&
    person.parentElement.classList.contains("player-row")
  ) {
    return person.parentElement;
  }
  const row = document.createElement("div");
  row.className = "player-row";
  const tcol = document.createElement("div");
  tcol.className = "tcol";
  person.before(row);
  row.appendChild(tcol);
  row.appendChild(person);
  return row;
}

function setTrophyForRow(row, rankIndex) {
  const tcol = row.querySelector(".tcol");
  if (!tcol) return;

  tcol.innerHTML = "";

  tcol.classList.remove("place-1", "place-2", "place-3");

  if (rankIndex < 3) {
    const img = document.createElement("img");
    img.src = `trophies/${rankIndex + 1}.png`;
    img.alt = `${rankIndex + 1} place`;
    tcol.appendChild(img);
    tcol.classList.add(`place-${rankIndex + 1}`);
  } else {
    const spacer = document.createElement("div");
    spacer.style.width = "40px";
    spacer.style.height = "1px";
    tcol.appendChild(spacer);
  }
}

function wrapInitialPeople() {
  const scoreboard = document.querySelector(".scoreboard");
  if (!scoreboard) return;
  $$(".person", scoreboard).forEach(ensureRow);
}

function updateAllTrophies() {
  const rows = Array.from(document.querySelectorAll(".scoreboard .player-row"));
  rows.forEach((row, i) => {
    const tcol = row.querySelector(".tcol");
    if (!tcol) return;

    tcol.innerHTML = "";
    tcol.classList.remove("place-1", "place-2", "place-3");

    if (i < 3) {
      const img = document.createElement("img");
      img.src = `trophies/${i + 1}.png`;
      img.alt = `${i + 1} place`;
      tcol.appendChild(img);
      tcol.classList.add(`place-${i + 1}`);
    } else {
      const spacer = document.createElement("div");
      spacer.style.width = "40px";
      spacer.style.height = "1px";
      tcol.appendChild(spacer);
    }
  });
}

function updateAllTrophiesByDom(scoreboard) {
  const rows = Array.from(scoreboard.querySelectorAll(".player-row"));
  rows.forEach((row, i) => {
    let tcol = row.querySelector(".tcol");
    if (!tcol) {
      tcol = document.createElement("div");
      tcol.className = "tcol";
      row.prepend(tcol);
    }
    tcol.innerHTML = "";
    tcol.classList.remove("place-1", "place-2", "place-3");

    if (i < 3) {
      const img = document.createElement("img");
      img.src = `trophies/${i + 1}.png`;
      img.alt = `${i + 1} place`;
      tcol.appendChild(img);
      tcol.classList.add(`place-${i + 1}`);
    } else {
      const spacer = document.createElement("div");
      spacer.style.width = "40px";
      spacer.style.height = "1px";
      tcol.appendChild(spacer);
    }
  });
}

function sortLeaderboard() {
  const scoreboard = document.querySelector(".scoreboard");
  if (!scoreboard) return;

  const addBtn = document.getElementById("addPlayerInline");
  const people = Array.from(scoreboard.querySelectorAll(".person"));

  const rows = people.map(ensureRow);

  const first = new Map();
  rows.forEach((row) => first.set(row, row.getBoundingClientRect()));

  const sortedRows = people
    .slice()
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .map((person) => ensureRow(person));

  rows.forEach((row) => row.classList.remove("first-place"));

  sortedRows.forEach((row, i) => {
    setTrophyForRow(row, i);
    if (addBtn) scoreboard.insertBefore(row, addBtn);
    else scoreboard.appendChild(row);
  });

  if (sortedRows.length > 0) {
    const topRow = sortedRows[0];
    const topPerson = topRow.querySelector(".person");
    const topScore = topPerson ? scoreOf(topPerson) : 0;
    const { total } = computeTotals();
    if (topScore > 0 && total > 0) topRow.classList.add("first-place");
  }

  sortedRows.forEach((row) => {
    const last = row.getBoundingClientRect();
    const f = first.get(row);
    if (!f) return;

    const dy = f.top - last.top;
    if (dy) {
      const style = row.style;
      const prevTransition = style.transition;
      style.transition = "none";
      style.transform = `translateY(${dy}px)`;

      row.getBoundingClientRect();

      style.transition = "transform 300ms ease";
      style.transform = "translateY(0)";

      row.addEventListener(
        "transitionend",
        () => {
          style.transition = prevTransition || "";
          style.transform = "";
        },
        { once: true }
      );
    }
  });
}

function refreshBoard() {
  sortLeaderboard();

  const { people, scores, sum, total } = computeTotals();

  updateProgressComputed(people, scores, total);
  updateTotalProgressComputed(sum, total);
  updateBeerMugComputed(sum, total);

  checkTotalReached(sum, total);
}

function makeNameEditable(nameEl) {
  if (!nameEl) return;

  nameEl.onclick = () => {
    const currentName = nameEl.textContent;

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "nameInput";
    input.maxLength = MAX_NAME_LEN;
    input.setAttribute("aria-label", "Player name");
    input.placeholder = `Max ${MAX_NAME_LEN} chars`;

    nameEl.replaceWith(input);
    input.focus();
    input.select();

    function save() {
      const newName = (input.value || "").slice(0, MAX_NAME_LEN).trim() || "—";
      nameEl.textContent = newName;
      input.replaceWith(nameEl);
      makeNameEditable(nameEl);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  };
}

function makeNumberEditable(numberEl) {
  if (!numberEl) return;

  numberEl.onclick = () => {
    const current = numberEl.textContent.trim();

    const input = document.createElement("input");
    input.type = "number";
    input.value = current || "0";
    input.className = "numberInput";

    numberEl.replaceWith(input);
    input.focus();
    input.select();

    function save() {
      const n = parseInt(input.value);
      const safe = Number.isFinite(n) ? n : 0;

      numberEl.textContent = String(safe);
      input.replaceWith(numberEl);

      makeNumberEditable(numberEl);
      refreshBoard();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  };
}

function setupPerson(person) {
  if (!person) return;

  let nameEl = person.querySelector(".name");
  if (!nameEl) {
    nameEl = document.createElement("p");
    nameEl.className = "name";
    nameEl.textContent = "—";
    person.prepend(nameEl);
  }
  makeNameEditable(nameEl);

  let rightSide = person.querySelector(".right-side");
  if (!rightSide) {
    rightSide = document.createElement("div");
    rightSide.className = "right-side";
    person.appendChild(rightSide);
  }

  let numberEl = person.querySelector(".number");
  if (!numberEl) {
    numberEl = document.createElement("p");
    numberEl.className = "number";
    numberEl.textContent = "0";
  }
  if (numberEl.parentElement !== rightSide) {
    rightSide.prepend(numberEl);
  }

  makeNumberEditable(numberEl);

  if (!rightSide.querySelector(".plusBtn")) {
    const plus = document.createElement("button");
    plus.className = "plusBtn";
    plus.textContent = "+";
    plus.addEventListener("click", () => {
      const { sum, total } = computeTotals();
      if (total > 0 && sum >= total) return;

      numberEl.textContent = (parseInt(numberEl.textContent) || 0) + 1;

      plus.classList.add("pop");
      plus.addEventListener(
        "animationend",
        () => {
          plus.classList.remove("pop");
        },
        { once: true }
      );

      const { sum: newSum, total: newTotal } = computeTotals();

      if (!(newTotal > 0 && newSum >= newTotal)) {
        const sound = document.getElementById("addBeerSound");
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch((err) => console.warn("Playback blocked:", err));
        }
      }

      refreshBoard();
    });

    rightSide.appendChild(plus);
  }

  const row = ensureRow(person);
  let remove = row.querySelector(".removeBtn");
  if (!remove) {
    remove = document.createElement("button");
    remove.className = "removeBtn";
    remove.textContent = "x";
    remove.addEventListener("click", () => {
      const row = person.parentElement.classList.contains("player-row")
        ? person.parentElement
        : person;

      row.style.height = row.offsetHeight + "px";

      row.getBoundingClientRect();

      row.classList.add("removing");

      const sound = document.getElementById("removePlayerSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }

      row.addEventListener(
        "transitionend",
        () => {
          row.remove();
          refreshBoard();
        },
        { once: true }
      );
    });

    row.appendChild(remove);
  } else if (remove.parentElement !== row) {
    row.appendChild(remove);
  }

  if (person.children.length >= 3) {
    person.append(nameEl, rightSide);
  }
}

function makeTotalEditable() {
  const label = document.getElementById("totalProgressLabel");
  if (!label) return;

  label.onclick = () => {
    firstTotalClick = false;

    const input = document.createElement("input");
    input.type = "number";
    input.value = totalDrinks;
    input.className = "totalInput";
    input.inputMode = "numeric";
    input.step = "1";
    input.min = "0";

    const sanitize = () => {
      let v = String(input.value || "");
      v = v.replace(/\D+/g, "");
      if (v.length > MAX_TOTAL_LEN) v = v.slice(0, MAX_TOTAL_LEN);
      input.value = v;
    };
    input.addEventListener("input", sanitize);
    input.addEventListener("paste", () => requestAnimationFrame(sanitize));
    input.addEventListener("keydown", (e) => {
      const blocked = [".", ",", "e", "E", "+", "-"];
      if (blocked.includes(e.key)) {
        e.preventDefault();
      }
    });

    const wrapper = document.createElement("div");
    wrapper.className = "totalEdit";
    const prefix = document.createElement("span");
    prefix.className = "totalEditLabel";
    prefix.textContent = "Total:";
    wrapper.append(prefix, input);

    label.replaceWith(wrapper);
    input.focus();
    input.select();

    function save() {
      const cleaned = String(input.value || "")
        .replace(/\D+/g, "")
        .slice(0, MAX_TOTAL_LEN);
      totalDrinks = parseInt(cleaned) || 0;

      const newLabel = document.createElement("h2");
      newLabel.id = "totalProgressLabel";

      newLabel.textContent = `Total: ${totalDrinks}`;
      wrapper.replaceWith(newLabel);

      makeTotalEditable();
      refreshBoard();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  };
}

function toggleDropdown() {
  const dropdown = document.getElementById("settingsDropdown");
  const isOpen = dropdown.classList.contains("open");
  dropdown.classList.toggle("open", !isOpen);
  if (!isOpen) {
    document.getElementById("appSettingsDropdown")?.classList.remove("open");
    const active =
      THEME_CLASSES.find((c) => document.body.classList.contains(c)) || null;
    if (active) updateActiveThemeButton(active);
  } else {
    document
      .querySelectorAll("#settingsDropdown button[data-theme].active")
      .forEach((b) => b.classList.remove("active"));
  }
  syncMenuOpenState();
}

function toggleAppSettings() {
  const dd = document.getElementById("appSettingsDropdown");
  const isOpen = dd.classList.contains("open");
  dd.classList.toggle("open", !isOpen);
  if (!isOpen) {
    document.getElementById("settingsDropdown")?.classList.remove("open");
  }
  syncMenuOpenState();
}

const THEME_CLASSES = [
  "theme-gradient",
  "theme-amber",
  "theme-berry",
  "theme-original1",
  "theme-original2",
];

function setTheme(themeClassOrImage) {
  const body = document.body;

  if (THEME_CLASSES.includes(themeClassOrImage)) {
    THEME_CLASSES.forEach((c) => body.classList.remove(c));
    body.classList.add(themeClassOrImage);
    body.style.removeProperty("background-image");
    try {
      localStorage.setItem("theme", themeClassOrImage);
    } catch {}
  } else {
    body.style.backgroundImage = `url("${themeClassOrImage}")`;
    THEME_CLASSES.forEach((c) => body.classList.remove(c));
  }
}
function updateActiveThemeButton(activeTheme) {
  const btns = document.querySelectorAll(
    "#settingsDropdown button[data-theme]"
  );
  btns.forEach((b) =>
    b.classList.toggle("active", b.dataset.theme === activeTheme)
  );
}

function currentTheme() {
  const body = document.body;
  return THEME_CLASSES.find((c) => body.classList.contains(c)) || null;
}

function selectTheme(theme) {
  const prev = currentTheme();
  const dd = document.getElementById("settingsDropdown");

  const wasOpen = dd && dd.classList.contains("open");
  let startH = 0;
  let startW = 0;
  if (wasOpen) {
    startH = dd.offsetHeight;
    startW = dd.offsetWidth;
  }

  document.body.classList.add("bg-fading");
  setTimeout(() => {
    setTheme(theme);
    if (dd) dd.classList.add("open");
    updateActiveThemeButton(theme);
    syncMenuOpenState();
    requestAnimationFrame(() => {
      document.body.classList.remove("bg-fading");
    });
  }, 180);

  if (dd) {
    const endH = dd.offsetHeight;
    const endW = dd.offsetWidth;
    if (startH !== endH || startW !== endW) {
      dd.classList.add("animating-dim");
      dd.style.height = startH + "px";
      dd.style.width = startW + "px";

      void dd.offsetHeight;
      dd.style.height = endH + "px";
      dd.style.width = endW + "px";
      dd.addEventListener(
        "transitionend",
        () => {
          dd.classList.remove("animating-dim");
          dd.style.height = "";
          dd.style.width = "";
        },
        { once: true }
      );
    } else {
    }
  } else {
  }
}

function updateRaveVars(intensity) {
  const i = Math.max(0, Math.min(100, Number(intensity) || 0));
  const t = i / 100;
  const body = document.body;

  let hueSec = 14 - 10 * t;
  let pulseSec = 5 - 2.5 * t;
  let saturationPct = 120 + 140 * t;
  let contrastPct = 100 + 25 * t;
  let opacityF = 0.4 + 0.4 * t;
  let blobAlpha = 0.18 + 0.22 * t;

  if (t > 0.85) {
    const boost = (t - 0.85) / 0.15;
    saturationPct += 80 * boost;
    contrastPct += 10 * boost;
    opacityF += 0.1 * boost;
    blobAlpha += 0.08 * boost;
    hueSec -= 2.0 * boost;
    pulseSec -= 0.8 * boost;
  }

  hueSec = Math.max(3.0, hueSec);
  pulseSec = Math.max(2.0, pulseSec);
  saturationPct = Math.min(360, Math.max(100, saturationPct));
  contrastPct = Math.min(150, Math.max(90, contrastPct));
  opacityF = Math.min(1.0, Math.max(0.2, opacityF));
  blobAlpha = Math.min(0.6, Math.max(0.1, blobAlpha));

  body.style.setProperty("--rave-hue-duration", hueSec.toFixed(2) + "s");
  body.style.setProperty("--rave-pulse-duration", pulseSec.toFixed(2) + "s");
  body.style.setProperty("--rave-saturation", Math.round(saturationPct) + "%");
  body.style.setProperty("--rave-contrast", Math.round(contrastPct) + "%");
  body.style.setProperty("--rave-opacity", opacityF.toFixed(2));
  body.style.setProperty("--rave-blob", blobAlpha.toFixed(2));

  try {
    localStorage.setItem("raveIntensity", String(i));
  } catch {}
}

window.addEventListener("click", (e) => {
  const container = e.target.closest(".settings-container");
  if (!container) {
    const dd = document.getElementById("settingsDropdown");
    if (dd) dd.classList.remove("open");
    document
      .querySelectorAll("#settingsDropdown button[data-theme].active")
      .forEach((b) => b.classList.remove("active"));
    document.getElementById("appSettingsDropdown")?.classList.remove("open");
    syncMenuOpenState();
  }
});

function syncMenuOpenState() {
  const appOpen = document
    .getElementById("appSettingsDropdown")
    ?.classList.contains("open");

  document.body.classList.toggle("menu-open", !!appOpen);
}

function setMuted(muted) {
  const audios = [
    document.getElementById("addBeerSound"),
    document.getElementById("addPlayerSound"),
    document.getElementById("removePlayerSound"),
    document.getElementById("beerWin"),
  ].filter(Boolean);
  audios.forEach((a) => (a.muted = !!muted));
  try {
    localStorage.setItem("muted", muted ? "1" : "0");
  } catch {}
}

let shakeEnabled = true;
function setShakeEnabled(enabled) {
  shakeEnabled = !!enabled;
  try {
    localStorage.setItem("shakeEnabled", shakeEnabled ? "1" : "0");
  } catch {}
  const mug = document.getElementById("beerMug");
  if (mug && !shakeEnabled) mug.classList.remove("shaking");

  try {
    const { sum, total } = computeTotals();
    updateBeerMugComputed(sum, total);
  } catch {}
}

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

async function setFullscreen(on) {
  try {
    if (on && !isFullscreen()) {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } else if (!on && isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)
        await document.mozCancelFullScreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
    }
  } catch (e) {
    console.warn("Fullscreen toggle failed", e);
  }
}

function toggleHeader() {
  const header = document.getElementById("header");
  const btn = document.getElementById("collapseHeader");
  const collapsed = header.classList.toggle("collapsed");
  if (btn) btn.textContent = collapsed ? "▾" : "▴";
  document.body.classList.toggle("header-collapsed", collapsed);
}

document.addEventListener("DOMContentLoaded", () => {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("theme");
  } catch {}
  if (savedTheme && THEME_CLASSES.includes(savedTheme)) {
    setTheme(savedTheme);
  } else {
    const hasTheme = THEME_CLASSES.some((c) =>
      document.body.classList.contains(c)
    );
    if (!hasTheme) {
      document.body.classList.add("theme-gradient");
    }
  }
  updateActiveThemeButton(
    THEME_CLASSES.find((c) => document.body.classList.contains(c)) ||
      "theme-gradient"
  );
  $$(".person").forEach(setupPerson);
  wrapInitialPeople();

  const addBtn = document.getElementById("addPlayerBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const name = document.getElementById("playerName").value.trim();
      const score = document.getElementById("playerScore").value.trim();
      if (!name || !score) return;

      const personDiv = document.createElement("div");
      personDiv.className = "person";
      personDiv.innerHTML = `
      <p class="name">${name}</p>
      <p class="number">${score}</p>
    `;
      document.querySelector(".scoreboard").appendChild(personDiv);
      setupPerson(personDiv);

      const row = ensureRow(personDiv);
      row.classList.add("adding");
      row.addEventListener(
        "animationend",
        () => {
          row.classList.remove("adding");
        },
        { once: true }
      );

      document.getElementById("playerName").value = "";
      document.getElementById("playerScore").value = "";

      refreshBoard();
    });
  }

  const addInline = document.getElementById("addPlayerInline");
  if (addInline) {
    addInline.addEventListener("click", () => {
      const personDiv = document.createElement("div");
      personDiv.className = "person";
      personDiv.innerHTML = `
      <p class="name">New Player</p>
      <p class="number">0</p>
    `;
      addInline.before(personDiv);
      setupPerson(personDiv);

      const row = ensureRow(personDiv);
      row.classList.add("adding");
      row.addEventListener(
        "animationend",
        () => {
          row.classList.remove("adding");
        },
        { once: true }
      );

      const sound = document.getElementById("addPlayerSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch((err) => console.warn("Playback blocked:", err));
      }

      refreshBoard();
    });
  }

  initConfetti();
  makeTotalEditable();
  refreshBoard();

  updateRaveVars(100);

  try {
    const savedMute = localStorage.getItem("muted");
    const savedShake = localStorage.getItem("shakeEnabled");
    if (savedMute != null) setMuted(savedMute === "1");
    if (savedShake != null) setShakeEnabled(savedShake === "1");
  } catch {}

  const muteToggle = document.getElementById("muteToggle");
  const fsToggle = document.getElementById("fsToggle");
  const shakeToggle = document.getElementById("shakeToggle");

  if (muteToggle) {
    try {
      muteToggle.checked = localStorage.getItem("muted") === "1";
    } catch {}
    muteToggle.addEventListener("change", (e) => setMuted(e.target.checked));
  }

  if (shakeToggle) {
    try {
      shakeToggle.checked =
        (localStorage.getItem("shakeEnabled") ?? "1") !== "1";
    } catch {}
    shakeToggle.addEventListener("change", (e) =>
      setShakeEnabled(!e.target.checked)
    );
  }

  const syncFs = () => {
    if (fsToggle) fsToggle.checked = isFullscreen();
  };
  syncFs();
  document.addEventListener("fullscreenchange", syncFs);
  document.addEventListener("webkitfullscreenchange", syncFs);
  document.addEventListener("mozfullscreenchange", syncFs);
  document.addEventListener("MSFullscreenChange", syncFs);
  if (fsToggle)
    fsToggle.addEventListener("change", (e) => setFullscreen(e.target.checked));

  document.addEventListener("mousemove", (e) => {
    const el = e.target.closest(".tcol.place-1, .tcol.place-2, .tcol.place-3");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", x + "px");
    el.style.setProperty("--my", y + "px");
  });

  const TIP_KEY = "beerboard_tip_dismissed_v1";
  const banner = document.getElementById("tipBanner");
  const dismiss = document.getElementById("dismissTip");
  if (banner && !localStorage.getItem(TIP_KEY)) {
    banner.style.display = "block";
  }
  if (dismiss) {
    dismiss.addEventListener("click", () => {
      localStorage.setItem(TIP_KEY, "1");
      const parent = dismiss.closest(".tip-banner");
      if (parent) parent.style.display = "none";
    });
  }
});
