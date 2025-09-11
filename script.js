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

function computeTotals() {
  const people = $$(".person");
  const scores = people.map(scoreOf);
  const sum = scores.reduce((a, b) => a + b, 0);
  return { people, scores, sum, total: totalDrinks };
}

function personFillGradient(percent) {
  return `linear-gradient(to right, #228b22 ${percent}%, #434343 ${percent}%)`;
}
function setPersonFill(person, percent) {
  // Use CSS ::before width to avoid repainting layout and keep theme consistent
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
    if (label) label.textContent = `Total: ${total} (click to edit)`;
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

  // map progress -> amplitude (in degrees) and speed (duration)
  // tweak these to taste
  const minAmp = 1; // deg
  const maxAmp = 8; // deg
  const amp = minAmp + (maxAmp - minAmp) * percent;

  const maxSpeed = 0.25; // s (fast at 100%)
  const minSpeed = 0.9; // s (slow at 0%)
  const dur = minSpeed - (minSpeed - maxSpeed) * percent;

  mug.style.setProperty("--amp", `${amp}deg`);
  mug.style.setProperty("--dur", `${dur}s`);
  mug.classList.toggle("shaking", percent > 0);
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

  if (rankIndex < 3) {
    const img = document.createElement("img");
    img.src = `trophies/${rankIndex + 1}.png`;
    img.alt = `${rankIndex + 1} place`;
    tcol.appendChild(img);
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

    if (i < 3) {
      const img = document.createElement("img");
      img.src = `trophies/${i + 1}.png`;
      img.alt = `${i + 1} place`;
      tcol.appendChild(img);
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

    if (i < 3) {
      const img = document.createElement("img");
      img.src = `trophies/${i + 1}.png`;
      img.alt = `${i + 1} place`;
      tcol.appendChild(img);
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

  sortedRows.forEach((row, i) => {
    setTrophyForRow(row, i);
    if (addBtn) scoreboard.insertBefore(row, addBtn);
    else scoreboard.appendChild(row);
  });

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

    nameEl.replaceWith(input);
    input.focus();
    input.select();

    function save() {
      const newName = input.value.trim() || "—";
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

      // ✅ trigger animation only on THIS button
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

  let remove = person.querySelector(".removeBtn");
  if (!remove) {
    remove = document.createElement("button");
    remove.className = "removeBtn";
    remove.textContent = "❌";
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

    person.appendChild(remove);
  }

  if (person.children.length >= 3) {
    person.append(nameEl, rightSide, remove);
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

    label.replaceWith(input);
    input.focus();
    input.select();

    function save() {
      totalDrinks = parseInt(input.value) || 0;

      const newLabel = document.createElement("h2");
      newLabel.id = "totalProgressLabel";

      newLabel.textContent = `Total: ${totalDrinks}`;
      input.replaceWith(newLabel);

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
}

const THEME_CLASSES = [
  "theme-gradient",
  "theme-bokeh",
  "theme-wood",
  "theme-original1",
  "theme-original2",
];

function setTheme(themeClassOrImage) {
  const body = document.body;

  // If a class name was provided, toggle classes. Otherwise fall back to image URL support
  if (THEME_CLASSES.includes(themeClassOrImage)) {
    THEME_CLASSES.forEach((c) => body.classList.remove(c));
    body.classList.add(themeClassOrImage);
    body.style.removeProperty("background-image");
  } else {
    body.style.backgroundImage = `url("${themeClassOrImage}")`;
    THEME_CLASSES.forEach((c) => body.classList.remove(c));
  }

  const dd = document.getElementById("settingsDropdown");
  if (dd) dd.classList.remove("open");
}

window.addEventListener("click", (e) => {
  if (!e.target.closest(".settings-container")) {
    document.getElementById("settingsDropdown").classList.remove("open");
  }
});

function hideTopBar() {
  const button = document.getElementById("hideHeader");
  const header = document.getElementById("header");

  header.classList.toggle("hidden");
  button.classList.toggle("rotated");

  document.body.classList.toggle(
    "header-hidden",
    header.classList.contains("hidden")
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // Set a default theme if none selected yet
  const hasTheme = THEME_CLASSES.some((c) => document.body.classList.contains(c));
  if (!hasTheme) {
    document.body.classList.add("theme-gradient");
  }
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

      // ✅ wrap into row + animate
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

      // ✅ wrap into row + animate
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

  // Show a one-time helpful tip to make interactions obvious
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
