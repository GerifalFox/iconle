// ======================
// CONFIGURACIÓN GLOBAL
// ======================

// Fecha de inicio del juego (DD/MM/YYYY)
const START_DATE = new Date(2026, 0, 10); // 10 enero 2026
const MAX_ATTEMPTS = 6;

// Puzzle de ejemplo (día 1)
const PUZZLE = {
  solution: ["🦖", "🏝️", "🚗"],
  difficulty: "medium",
  title: "Jurassic Park"
};

// Teclado reducido (temporal)
const ICONS = [
  "🦖","🏝️","🚗","🚢","💔","🌊",
  "🤖","⚡","🌌","👻","❤️","🔫"
];

// ======================
// CÁLCULO DEL DÍA
// ======================

function getDayNumber() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today - START_DATE;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

const DAY_NUMBER = getDayNumber();
const STORAGE_KEY = `iconle-day-${DAY_NUMBER}`;

// ======================
// ESTADO
// ======================

let currentRow = 0;
let currentGuess = [];
let finished = false;
let guesses = [];

// ======================
// ELEMENTOS DOM
// ======================

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const status = document.getElementById("status");
const checkBtn = document.getElementById("checkBtn");
const deleteBtn = document.getElementById("deleteBtn");

// ======================
// INICIALIZACIÓN
// ======================

function initBoard() {
  board.innerHTML = "";
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
  keyboard.innerHTML = "";
  ICONS.forEach(icon => {
    const key = document.createElement("div");
    key.className = "key";
    key.textContent = icon;
    key.addEventListener("click", () => onKey(icon));
    keyboard.appendChild(key);
  });
}

// ======================
// INPUT
// ======================

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

// ======================
// RENDER
// ======================

function renderCurrentRow() {
  const row = board.children[currentRow];
  [...row.children].forEach((cell, i) => {
    cell.textContent = currentGuess[i] || "";
  });
}

function updateButtons() {
  checkBtn.disabled = currentGuess.length !== 3;
}

// ======================
// LÓGICA PRINCIPAL
// ======================

function checkGuess() {
  const row = board.children[currentRow];
  const solutionCopy = [...PUZZLE.solution];

  // Verdes
  currentGuess.forEach((icon, i) => {
    const cell = row.children[i];
    if (icon === PUZZLE.solution[i]) {
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

  guesses.push([...currentGuess]);
  saveState();

  if (currentGuess.join("") === PUZZLE.solution.join("")) {
    finished = true;
    status.textContent = `¡Correcto! 🎉 — ${PUZZLE.title}`;
    return;
  }

  currentRow++;
  currentGuess = [];
  updateButtons();

  if (currentRow >= MAX_ATTEMPTS) {
    finished = true;
    status.textContent =
      `Fin. La película era ${PUZZLE.title} ${PUZZLE.solution.join("")}`;
  }
}

// ======================
// PERSISTENCIA
// ======================

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentRow,
      guesses,
      finished
    })
  );
}

function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;

  const state = JSON.parse(data);
  currentRow = state.currentRow;
  guesses = state.guesses;
  finished = state.finished;

  guesses.forEach((guess, rowIndex) => {
    currentGuess = guess;
    currentRow = rowIndex;
    checkGuess();
  });

  currentGuess = [];
}

// ======================
// START
// ======================

initBoard();
initKeyboard();
loadState();
updateButtons();
