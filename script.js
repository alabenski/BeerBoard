let totalDrinks = 0;

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
  person.style.background = personFillGradient(percent);
}

function updateProgressComputed(people, scores, total) {
  people.forEach((person, i) => {
    const percent = total > 0 ? (scores[i] / total) * 100 : 0;
    setPersonFill(person, percent);
  });
}

function updateTotalProgressComputed(sum, total) {
  const totalBar = document.getElementById("totalProgress");
  const label = document.getElementById("totalProgressLabel");
  if (totalBar) {
    const percent = total > 0 ? (sum / total) * 100 : 0;
    totalBar.style.background = personFillGradient(percent);
  }
  if (label) label.textContent = `Total: ${sum} / ${total}`;
}

function updateBeerMugComputed(sum, total) {
  const mug = document.getElementById("beerMug");
  if (!mug) return;

  if (total <= 0) {
    mug.src = "beers/beer1.png";
    mug.className = "";
    return;
  }
  const fullness = Math.min(7, Math.max(1, Math.round((sum / total) * 7)));
  mug.src = `beers/beer${fullness}.png`;
  mug.className = fullness > 1 ? `shake${fullness}` : "";
}

function sortLeaderboard() {
  const scoreboard = document.querySelector(".scoreboard");
  if (!scoreboard) return;

  const addBtn = document.getElementById("addPlayerInline");
  const people = Array.from(scoreboard.querySelectorAll(".person"));

  people.sort((a, b) => scoreOf(b) - scoreOf(a));

  people.forEach((person) => {
    if (addBtn) scoreboard.insertBefore(person, addBtn);
    else scoreboard.appendChild(person);
  });
}

function refreshBoard() {
  sortLeaderboard();
  const { people, scores, sum, total } = computeTotals();
  updateProgressComputed(people, scores, total);
  updateTotalProgressComputed(sum, total);
  updateBeerMugComputed(sum, total);
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
      const sound = document.getElementById("addBeerSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch((err) => console.warn("Playback blocked:", err));
      }
      numberEl.textContent = (parseInt(numberEl.textContent) || 0) + 1;
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
      person.remove();
      refreshBoard();
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

document.addEventListener("DOMContentLoaded", () => {
  $$(".person").forEach(setupPerson);

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

      const sound = document.getElementById("addPlayerSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch((err) => console.warn("Playback blocked:", err));
      }

      refreshBoard();
    });
  }

  makeTotalEditable();
  refreshBoard();
});
