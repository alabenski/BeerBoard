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

function sortLeaderboard() {
  const scoreboard = document.querySelector(".scoreboard");
  const people = Array.from(scoreboard.querySelectorAll(".person"));

  // sort descending by score
  people.sort((a, b) => {
    const scoreA = parseInt(a.querySelector(".number").innerText) || 0;
    const scoreB = parseInt(b.querySelector(".number").innerText) || 0;
    return scoreB - scoreA;
  });

  // re-append in new order
  people.forEach((person) => scoreboard.appendChild(person));
}

function refreshBoard() {
  sortLeaderboard();
  updateProgress();
  updateBeerMug();
}


function openEditor() {
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
    document.getElementById(
      "totalDisplay"
    ).innerText = `Total Drinks: ${totalDrinks}`;
    refreshBoard();
  });

  editor.style.display = "block";
}

function updateBeerMug() {
  if (totalDrinks <= 0) {
    document.getElementById("beerMug").src = "beer1.png";
    return;
  }

  // Find sum of all scores
  let currentTotal = 0;
  document.querySelectorAll(".person .number").forEach((num) => {
    currentTotal += parseInt(num.innerText) || 0;
  });

  // Calculate fullness (1–7)
  const fullness = Math.min(
    7,
    Math.max(1, Math.round((currentTotal / totalDrinks) * 7))
  );

  document.getElementById("beerMug").src = `beer${fullness}.png`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addPlayerBtn").addEventListener("click", () => {
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

    document.getElementById("playerName").value = "";
    document.getElementById("playerScore").value = "";

    openEditor();
    refreshBoard();
  });

  refreshBoard();
});
