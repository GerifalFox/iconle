// ======================
// CONFIGURACIÓN
// ======================

const MAX_ATTEMPTS = 6;
const ICONS = [
  "🦖","🏝️","🚗","🚢","💔","🌊",
  "🤖","⚡","🌌","👻","❤️","🔫",
  "👸","🐸","💋","🧙‍♂️","🪄","🏰",
  "🦁","👑","🐾","🚢","🧊","🧞‍♂️","💡","🕌",
  "👨‍🚀","🌕","🦸‍♂️","🕷️","🦇","🐵","🌴","👦"
];

// ======================
// DÍA ACTIVO (FIJO)
// ======================

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

let DAY_KEY = localStorage.getItem("iconle-current-day");
const REAL_TODAY = getTodayKey();

if (!DAY_KEY) {
  DAY_KEY = REAL_TODAY;
  localStorage.setItem("iconle-current-day", DAY_KEY);
}

if (DAY_KEY !== REAL_TODAY) {
  localStorage.removeItem(`iconle-${DAY_KEY}`);
  localStorage.setItem("iconle-current-day", REAL_TODAY);
  location.reload();
}

const STORAGE_KEY = `iconle-${DAY_KEY}`;

// ======================
// ESTADO
// ======================

let currentRow = 0;
let currentGuess = [];
let finished = false;
let guesses = [];
let PUZZLE = null;

// ======================
// DOM
// ======================

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const status = document.getElementById("status");
const checkBtn = document.getElementById("checkBtn");
const deleteBtn = document.getElementById("deleteBtn");

// ======================
// INIT
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
  submitGuess();
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

function renderGuessResult(guess, rowIndex) {
  const row = board.children[rowIndex];
  const solutionCopy = [...PUZZLE.solution];

  // verdes
  guess.forEach((icon, i) => {
    const cell = row.children[i];
    cell.textContent = icon;
    if (icon === PUZZLE.solution[i]) {
      cell.classList.add("green");
      solutionCopy[i] = null;
    }
  });

  // amarillos / grises
  guess.forEach((icon, i) => {
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
}

// ======================
// GAME LOGIC
// ======================

function submitGuess() {
  const guess = [...currentGuess];
  guesses.push(guess);

  renderGuessResult(guess, currentRow);

  if (guess.join("") === PUZZLE.solution.join("")) {
    finished = true;
    status.textContent = `¡Correcto! 🎉 — ${PUZZLE.title}`;
    saveState();
    return;
  }

  currentRow++;
  currentGuess = [];
  updateButtons();
  saveState();

  if (currentRow >= MAX_ATTEMPTS) {
    finished = true;
    status.textContent =
      `Fin. La película era ${PUZZLE.title} ${PUZZLE.solution.join("")}`;
    saveState();
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

  guesses.forEach((guess, index) => {
    renderGuessResult(guess, index);
  });

  if (finished) {
    if (guesses.some(g => g.join("") === PUZZLE.solution.join(""))) {
      status.textContent = `¡Correcto! 🎉 — ${PUZZLE.title}`;
    } else {
      status.textContent =
        `Fin. La película era ${PUZZLE.title} ${PUZZLE.solution.join("")}`;
    }
  }
}

// ======================
// CARGA DEL JSON
// ======================

async function loadPuzzleJSON() {
  try {
    const res = await fetch("puzzles.json");
    const puzzles = await res.json();

    // Elegir puzzle según día (mod 10 para 10 puzzles)
    const dayIndex = new Date().getDate() % puzzles.length;
    PUZZLE = puzzles[dayIndex];

    initBoard();
    initKeyboard();
    loadState();
    updateButtons();
  } catch (err) {
    console.error("Error cargando puzzles.json", err);
  }
}

// ======================
// START
// ======================

loadPuzzleJSON();
