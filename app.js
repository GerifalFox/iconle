// ======================
// CONFIGURACIÓN
// ======================

const MAX_ATTEMPTS = 6;

const ICONS = [
  // Personajes y Figuras (7) - Cubrimos todos los roles
  "👦", "🧔", "👩", "👸", "🧙‍♂️", "🦸‍♂️", "👻",

  // Animales (10) - Los más icónicos del cine
  "🦖", "🦁", "🐵", "🦇", "🕷️", "🐺", "🐍", "🐟", "🦈", "🐀",

  // Vehículos (6) - Esenciales para acción y viajes
  "🚗", "🚢", "✈️", "🚀", "🚲", "🛸",

  // Escenarios y Clima (9) - El "donde" ocurre la historia
  "🏝️", "🏰", "🏜️", "🏙️", "🏠", "🌌", "🌲", "❄️", "🌋",

  // Objetos y Cine (11) - Herramientas de trama
  "🔫", "🎬", "🎩", "⚔️", "💎", "💰", "💍", "🍎", "💊", "📖", "📞",

  // Conceptos y Abstraptos (10) - El "tono" de la película
  "❤️", "💀", "👑", "🌊", "🌕", "🌞", "⚡", "🎵", "💤", "🎭"
];


const DIFFICULTY_MAP = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil"
};

// ======================
// DÍA ACTIVO (FIJO)
// ======================

function getTodayKey() {
  const d = new Date();
  return d.toISOString().split("T")[0];
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
let guesses = [];
let finished = false;
let PUZZLE = null;

// ======================
// DOM
// ======================

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const status = document.getElementById("status");
const checkBtn = document.getElementById("checkBtn");
const deleteBtn = document.getElementById("deleteBtn");
const titleEl = document.getElementById("daily-title");
const diffEl = document.getElementById("daily-difficulty");
const shareBtn = document.getElementById("shareBtn");

const statPlayed = document.getElementById("stat-played");
const statWins = document.getElementById("stat-wins");
const statStreak = document.getElementById("stat-streak");
const statMaxStreak = document.getElementById("stat-max-streak");

// ======================
// INIT UI
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
  if (finished || currentGuess.length >= 3) return;
  currentGuess.push(icon);
  renderCurrentRow();
  updateButtons();
}

deleteBtn.onclick = () => {
  if (finished || currentGuess.length === 0) return;
  currentGuess.pop();
  renderCurrentRow();
  updateButtons();
};

checkBtn.onclick = () => {
  if (finished || currentGuess.length !== 3) return;
  submitGuess();
};

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

  guess.forEach((icon, i) => {
    const cell = row.children[i];
    cell.textContent = icon;
    if (icon === PUZZLE.solution[i]) {
      cell.classList.add("green");
      solutionCopy[i] = null;
    }
  });

  guess.forEach((icon, i) => {
    const cell = row.children[i];
    if (cell.classList.contains("green")) return;
    const idx = solutionCopy.indexOf(icon);
    if (idx !== -1) {
      cell.classList.add("yellow");
      solutionCopy[idx] = null;
    } else {
      cell.classList.add("gray");
    }
  });
}

// ======================
// GAME
// ======================

function submitGuess() {
  const guess = [...currentGuess];
  guesses.push(guess);
  renderGuessResult(guess, currentRow);

  if (guess.join("") === PUZZLE.solution.join("")) {
    finished = true;
    status.textContent = `¡Correcto! / Correct! 🎉 Solución / Solution: ${PUZZLE.solution.join(" ")}`;

    const stats = getStats();
    stats.played++;
    stats.wins++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    saveStats(stats);

    saveState();
    shareBtn.disabled = false;
  return;
  }

  currentRow++;
  currentGuess = [];
  updateButtons();
  saveState();

  if (currentRow >= MAX_ATTEMPTS) {
    finished = true;
    status.textContent = `Fin del juego / End of the game. Solución / Solution: ${PUZZLE.solution.join(" ")}`;

    const stats = getStats();
    stats.played++;
    stats.currentStreak = 0;
    saveStats(stats);

    saveState();
    shareBtn.disabled = false;
  }
}

// ======================
// STORAGE
// ======================

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ currentRow, guesses, finished })
  );
}

function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  const state = JSON.parse(data);
  currentRow = state.currentRow;
  guesses = state.guesses;
  finished = state.finished;
  guesses.forEach(renderGuessResult);
}



// ======================
// STATS
// ======================

const STATS_KEY = "iconle-stats";

function getStats() {
  return JSON.parse(localStorage.getItem(STATS_KEY)) || {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0
  };
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const stats = getStats();
  statPlayed.textContent = stats.played;
  statWins.textContent = stats.wins;
  statStreak.textContent = stats.currentStreak;
  statMaxStreak.textContent = stats.maxStreak;
}


// ======================
// SHARE RESULTS
// ======================

shareBtn.onclick = () => {
  if (!finished) return;

  const day = DAY_KEY;
  const attemptText =
    currentRow < MAX_ATTEMPTS
      ? `${currentRow + 1}/${MAX_ATTEMPTS}`
      : `X/${MAX_ATTEMPTS}`;

  const grid = guesses.map(guess => {
    return guess.map((icon, i) => {
      if (icon === PUZZLE.solution[i]) return "🟩";
      if (PUZZLE.solution.includes(icon)) return "🟨";
      return "⬛";
    }).join("");
  }).join("\n");

  const text =
`ICONLE ${day}
${attemptText}

${grid}

${PUZZLE.title_es} / ${PUZZLE.title_en}
https://iconle.com`;

  // MÉTODO MODERNO
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      status.textContent = "Resultado copiado al portapapeles 📋";
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
};

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  status.textContent = "Resultado copiado al portapapeles 📋";
}



// ======================
// LOAD PUZZLE
// ======================

async function loadPuzzle() {
  const res = await fetch("puzzles.json");
  const puzzles = await res.json();
  const index = new Date().getDate() % puzzles.length;
  PUZZLE = puzzles[index];

  titleEl.textContent = `${PUZZLE.title_es} / ${PUZZLE.title_en}`;
  diffEl.textContent = `Dificultad: ${DIFFICULTY_MAP[PUZZLE.difficulty]}`;
  
  initBoard();
  initKeyboard();
  loadState();
  updateButtons();
  renderStats();
  shareBtn.disabled = !finished;
}

loadPuzzle();
