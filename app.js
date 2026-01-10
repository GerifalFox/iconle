// --- CONFIGURACIÓN TEMPORAL (mock del día) ---
const SOLUTION = ["🦖", "🏝️", "🚗"]; // Jurassic Park (ejemplo)
const MAX_ATTEMPTS = 6;

// Teclado inicial (subset del set final)
const ICONS = [
  "🦖","🏝️","🚗","🚢","💔","🌊",
  "🤖","⚡","🌌","👻","❤️","🔫"
];

// --- ESTADO ---
let currentRow = 0;
let currentGuess = [];
let finished = false;

// --- ELEMENTOS ---
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const status = document.getElementById("status");

// --- INICIALIZACIÓN ---
function initBoard() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let j = 0; j < 3; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
}

function initKeyboard() {
  ICONS.forEach(icon => {
    const key = document.createElement("div");
    key.className = "key";
    key.textContent = icon;
    key.addEventListener("click", () => onKey(icon));
    keyboard.appendChild(key);
  });
}

// --- LÓGICA ---
function onKey(icon) {
  if (finished) return;
  if (currentGuess.length >= 3) return;

  currentGuess.push(icon);
  renderCurrentRow();

  if (currentGuess.length === 3) {
    checkGuess();
  }
}

function renderCurrentRow() {
  const row = board.children[currentRow];
  [...row.children].forEach((cell, i) => {
    cell.textContent = currentGuess[i] || "";
  });
}

function checkGuess() {
  const row = board.children[currentRow];
  const solutionCopy = [...SOLUTION];

  currentGuess.forEach((icon, i) => {
    let cell = row.children[i];
    if (icon === SOLUTION[i]) {
      cell.classList.add("green");
      solutionCopy[i] = null;
    }
  });

  currentGuess.forEach((icon, i) => {
    let cell = row.children[i];
    if (cell.classList.contains("green")) return;
    if (solutionCopy.includes(icon)) {
      cell.classList.add("yellow");
      solutionCopy[solutionCopy.indexOf(icon)] = null;
    } else {
      cell.classList.add("gray");
    }
  });

  if (currentGuess.join("") === SOLUTION.join("")) {
    finished = true;
    status.textContent = "¡Correcto! 🎉";
    return;
  }

  currentRow++;
  currentGuess = [];

  if (currentRow >= MAX_ATTEMPTS) {
    finished = true;
    status.textContent = "Fin. La solución era " + SOLUTION.join("");
  }
}

// --- START ---
initBoard();
initKeyboard();
