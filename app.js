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
const checkBtn = document.getElementById("checkBtn");
const deleteBtn = document.getElementById("deleteBtn");

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

// --- INPUT ---
function onKey(icon) {
  if (finished) return;
  if (currentGuess.length >= 3) return;

  currentGuess.push(icon);
  renderCurrentRow();
  updateButtons();
}

deleteBtn.addEventListener("click", () => {
  if (finished) return;
  if (currentGuess.length === 0) return;

  currentGuess.pop();
  renderCurrentRow();
  updateButtons();
});

checkBtn.addEventListener("click", () => {
  if (finished) return;
  if (currentGuess.length !== 3) return;

  checkGuess();
});

// --- RENDER ---
function renderCurrentRow() {
  const row = board.children[currentRow];
  [...row.children].forEach((cell, i) => {
    cell.textContent = currentGuess[i] || "";
  });
}

function updateButtons() {
  checkBtn.disabled = currentGuess.length !== 3;
}

// --- LÓGICA PRINCIPAL ---
function checkGuess() {
  const row = board.children[currentRow];
  const solutionCopy = [...SOLUTION];

  // Verdes
  currentGuess.forEach((icon, i) => {
    const cell = row.children[i];
    if (icon === SOLUTION[i]) {
      cell.classList.add("green");
      solutionCopy[i] = null;
    }
  });

  // Amarillos / grises
  currentGuess.forEach((icon, i) => {
    const cell = row.children[i];
    if (cell.classList.contains("green")) return;

    const index = solutionCopy.indexOf(icon);
    if (index !== -1) {
      cell.classList.add("yellow");
      solutionCopy[index] = null;
    } else {
      cell.classList.add("gray");
    }
  });

  // Comprobar victoria
  if (currentGuess.join("") === SOLUTION.join("")) {
    finished = true;
    status.textContent = "¡Correcto! 🎉";
    return;
  }

  // Siguiente intento
  currentRow++;
  currentGuess = [];
  updateButtons();

  // Fin del juego
  if (currentRow >= MAX_ATTEMPTS) {
    finished = true;
    status.textContent = "Fin. La solución era " + SOLUTION.join("");
  }
}

// --- START ---
initBoard();
initKeyboard();
updateButtons();
