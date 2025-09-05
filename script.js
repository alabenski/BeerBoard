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
  const addBtn = document.getElementById("addPlayerInline");
  const people = Array.from(scoreboard.querySelectorAll(".person"));

  people.sort((a, b) => {
    const aNum = a.querySelector(".number");
    const bNum = b.querySelector(".number");
    const scoreA = aNum ? parseInt(aNum.innerText) || 0 : 0;
    const scoreB = bNum ? parseInt(bNum.innerText) || 0 : 0;
    return scoreB - scoreA;
  });

  people.forEach((person) => {
    if (addBtn) {
      scoreboard.insertBefore(person, addBtn);
    } else {
      scoreboard.appendChild(person);
    }
  });
}

function refreshBoard() {
  sortLeaderboard();
  updateProgress();
  updateTotalProgress();
  updateBeerMug();
}

// function openEditor(fromClick = false) {
//   if (fromClick) {
//     const sound = document.getElementById("editorSound");
//     sound.currentTime = 0;
//     sound.play().catch((err) => console.warn("Playback blocked:", err));
//   }

//   document.getElementById("editBtn").style.display = "none";
//   document.getElementById("closeBtn").style.display = "block";

//   const editor = document.getElementById("editor");
//   const editorList = document.getElementById("editorList");
//   editorList.innerHTML = "";

//   document.querySelectorAll(".person").forEach((person, idx) => {
//     const name = person.querySelector(".name").innerText;
//     const score = person.querySelector(".number").innerText;

//     const row = document.createElement("div");
//     row.style.marginBottom = "8px";

//     const nameInput = document.createElement("input");
//     nameInput.type = "text";
//     nameInput.value = name;
//     nameInput.addEventListener("input", () => {
//       person.querySelector(".name").innerText = nameInput.value.trim() || "—";
//     });

//     const scoreInput = document.createElement("input");
//     scoreInput.type = "number";
//     scoreInput.value = score;
//     scoreInput.addEventListener("input", () => {
//       person.querySelector(".number").innerText =
//         scoreInput.value.trim() || "0";
//       refreshBoard();
//     });

//     const removeBtn = document.createElement("button");
//     removeBtn.textContent = "🗑 Remove";
//     removeBtn.style.backgroundColor = "rgb(159,0,0)";
//     removeBtn.addEventListener("click", () => {
//       person.remove();
//       openEditor();
//       refreshBoard();
//     });

//     row.appendChild(nameInput);
//     row.appendChild(scoreInput);
//     row.appendChild(removeBtn);

//     editorList.appendChild(row);
//   });

//   const totalInput = document.getElementById("total");
//   totalInput.value = totalDrinks;
//   totalInput.addEventListener("input", () => {
//     totalDrinks = parseInt(totalInput.value) || 0;
//     refreshBoard();
//   });

//   editor.style.display = "block";
// }

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
    input.select();

    function save() {
      const newName = input.value.trim() || "—";
      nameEl.innerText = newName;
      input.replaceWith(nameEl);

      makeNameEditable(nameEl);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  });
}

function setupPerson(person) {
  let nameEl = person.querySelector(".name");
  if (!nameEl) {
    nameEl = document.createElement("p");
    nameEl.className = "name";
    nameEl.innerText = "—";
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
    numberEl.innerText = "0";
  }

  if (numberEl.parentElement !== rightSide) {
    rightSide.prepend(numberEl);
  }

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
    const input = document.createElement("input");
    input.type = "number";
    input.value = totalDrinks;
    input.className = "totalInput";

    label.replaceWith(input);
    input.focus();

    function save() {
      totalDrinks = parseInt(input.value) || 0;

      const newLabel = document.createElement("h2");
      newLabel.id = "totalProgressLabel";
      newLabel.innerText = `Total: ${totalDrinks}`;
      input.replaceWith(newLabel);

      makeTotalEditable();

      refreshBoard();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
    });
    input.addEventListener("blur", save);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".person").forEach(setupPerson);

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

      openEditor();

      refreshBoard();
    });
  }

  const addInline = document.getElementById("addPlayerInline");
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

  makeTotalEditable();

  refreshBoard();
});
