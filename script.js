let totalDrinks = 0;

function updateProgress() {
  const people = document.querySelectorAll(".person");
  people.forEach((person) => {
    const score = parseInt(person.querySelector(".number").innerText) || 0;
    const percent = totalDrinks > 0 ? (score / totalDrinks) * 100 : 0;

    person.style.background = `
      linear-gradient(
        to right,
        #228b22 ${percent}%,
        #434343 ${percent}%
      )
    `;
  });
}

function updateTotalProgress() {
  const total = document.getElementById("totalProgress");
  const label = document.getElementById("totalProgressLabel");
  let sum = 0;

  const people = document.querySelectorAll(".person");
  people.forEach((person) => {
    const score = parseInt(person.querySelector(".number").innerText) || 0;
    sum += score;
  });

  const percent = totalDrinks > 0 ? (sum / totalDrinks) * 100 : 0;
  total.style.background = `
    linear-gradient(
      to right,
      #228b22 ${percent}%,
      #434343 ${percent}%
    )
  `;

  label.innerText = `Total: ${sum} / ${totalDrinks}`;
}

function sortLeaderboard() {
  const scoreboard = document.querySelector(".scoreboard");
  const people = Array.from(scoreboard.querySelectorAll(".person"));

  people.sort((a, b) => {
    const aNum = a.querySelector(".number");
    const bNum = b.querySelector(".number");
    const scoreA = aNum ? parseInt(aNum.innerText) || 0 : 0;
    const scoreB = bNum ? parseInt(bNum.innerText) || 0 : 0;
    return scoreB - scoreA;
  });

  people.forEach((p) => scoreboard.appendChild(p));
}

function refreshBoard() {
  sortLeaderboard();
  updateProgress();
  updateTotalProgress();
  updateBeerMug();
}

function openEditor(fromClick = false) {
  if (fromClick) {
    const sound = document.getElementById("editorSound");
    sound.currentTime = 0;
    sound.play().catch((err) => console.warn("Playback blocked:", err));
  }

  document.getElementById("editBtn").style.display = "none";
  document.getElementById("closeBtn").style.display = "block";

  const editor = document.getElementById("editor");
  const editorList = document.getElementById("editorList");
  editorList.innerHTML = "";

  document.querySelectorAll(".person").forEach((person, idx) => {
    const name = person.querySelector(".name").innerText;
    const score = person.querySelector(".number").innerText;

    const row = document.createElement("div");
    row.style.marginBottom = "8px";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = name;
    nameInput.addEventListener("input", () => {
      person.querySelector(".name").innerText = nameInput.value.trim() || "—";
    });

    const scoreInput = document.createElement("input");
    scoreInput.type = "number";
    scoreInput.value = score;
    scoreInput.addEventListener("input", () => {
      person.querySelector(".number").innerText =
        scoreInput.value.trim() || "0";
      refreshBoard();
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑 Remove";
    removeBtn.style.backgroundColor = "rgb(159,0,0)";
    removeBtn.addEventListener("click", () => {
      person.remove();
      openEditor();
      refreshBoard();
    });

    row.appendChild(nameInput);
    row.appendChild(scoreInput);
    row.appendChild(removeBtn);

    editorList.appendChild(row);
  });

  const totalInput = document.getElementById("total");
  totalInput.value = totalDrinks;
  totalInput.addEventListener("input", () => {
    totalDrinks = parseInt(totalInput.value) || 0;
    refreshBoard();
  });

  editor.style.display = "block";
}

function closeEditor() {
  document.getElementById("editor").style.display = "none";
  document.getElementById("closeBtn").style.display = "none";
  document.getElementById("editBtn").style.display = "block";
}

function updateBeerMug() {
  const mug = document.getElementById("beerMug");

  if (totalDrinks <= 0) {
    mug.src = "beers/beer1.png";
    mug.className = "";
    return;
  }

  let currentTotal = 0;
  document.querySelectorAll(".person .number").forEach((num) => {
    currentTotal += parseInt(num.innerText) || 0;
  });

  const fullness = Math.min(
    7,
    Math.max(1, Math.round((currentTotal / totalDrinks) * 7))
  );

  mug.src = `beers/beer${fullness}.png`;

  mug.className = fullness > 1 ? `shake${fullness}` : "";
}

function makeNameEditable(nameEl) {
  nameEl.addEventListener("click", () => {
    const currentName = nameEl.innerText;

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "nameInput";

    nameEl.replaceWith(input);
    input.focus();
    input.select(); // 🔥 highlight all text immediately

    function save() {
      const newName = input.value.trim() || "—";
      nameEl.innerText = newName;
      input.replaceWith(nameEl);

      // re-enable editing for future clicks
      makeNameEditable(nameEl);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  });
}

function setupPerson(person) {
  // name (left)
  let nameEl = person.querySelector(".name");
  if (!nameEl) {
    nameEl = document.createElement("p");
    nameEl.className = "name";
    nameEl.innerText = "—";
    person.prepend(nameEl);
  }
  makeNameEditable(nameEl);

  // right-side (number + plus)
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
    numberEl.innerText = "0";
  }
  // ensure number lives inside rightSide (move it if needed)
  if (numberEl.parentElement !== rightSide) {
    rightSide.prepend(numberEl);
  }

  // plus button (only one)
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
      numberEl.innerText = (parseInt(numberEl.innerText) || 0) + 1;
      refreshBoard();
    });
    rightSide.appendChild(plus);
  }

  // remove button (far right; only one)
  if (!person.querySelector(".removeBtn")) {
    const remove = document.createElement("button");
    remove.className = "removeBtn";
    remove.textContent = "❌";
    remove.addEventListener("click", () => {
      person.remove();
      refreshBoard();
    });
    person.appendChild(remove);
  }
}

function makeTotalEditable() {
  const label = document.getElementById("totalProgressLabel");
  label.addEventListener("click", () => {
    // current total is in global totalDrinks
    const input = document.createElement("input");
    input.type = "number";
    input.value = totalDrinks;
    input.className = "totalInput";

    label.replaceWith(input);
    input.focus();

    function save() {
      totalDrinks = parseInt(input.value) || 0;

      // rebuild the label
      const newLabel = document.createElement("h2");
      newLabel.id = "totalProgressLabel";
      newLabel.innerText = `Total: ${totalDrinks}`;
      input.replaceWith(newLabel);

      // re-attach click-to-edit
      makeTotalEditable();

      // refresh progress visuals
      refreshBoard();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // 1) Initialize existing players (adds right-side, +, remove, and name editing)
  document.querySelectorAll(".person").forEach(setupPerson);

  // 2) Add Player (single listener)
  const addBtn = document.getElementById("addPlayerBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const name = document.getElementById("playerName").value.trim();
      const score = document.getElementById("playerScore").value.trim();
      if (!name || !score) return;

      // Build the new person row
      const personDiv = document.createElement("div");
      personDiv.className = "person";
      personDiv.innerHTML = `
        <p class="name">${name}</p>
        <p class="number">${score}</p>
      `;

      // Insert, then let setupPerson do the wiring (right-side/+ /remove /editable name)
      document.querySelector(".scoreboard").appendChild(personDiv);
      setupPerson(personDiv);

      // Clear form
      document.getElementById("playerName").value = "";
      document.getElementById("playerScore").value = "";

      // If you want the editor to pop back open after adding, keep this:
      openEditor(); // or remove this line if you don't want it to auto-open

      // Update sort/progress/mug/total bar
      refreshBoard();
    });
  }

  // 3) Make the total in the progress bar editable
  makeTotalEditable();

  // 4) Initial sort/progress/mug update
  refreshBoard();
});
