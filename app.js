// ======================
// CONFIGURACIÓN
// ======================

const MAX_ATTEMPTS = 6;

const ICONS = [
  "👦", "🧔", "👩", "👸", "🧙‍♂️", "🦸‍♂️", "👻",
  "🦖", "🦁", "🐵", "🦇", "🤖", "🐺", "🐍", "🐟", "🦈", "🐀", "🚗",
  "🚢", "✈️", "🚀", "🚲", "🛸", "🏝️", "🏰", "🏜️", "🏙️", "🏠", "🌌",
  "🌲", "❄️", "🌋", "🔫", "🎬", "🎩", "⚔️", "💎", "💰", "💍", "🍎",
  "💊", "📖", "📞", "❤️", "💀", "👑", "🌊", "🌕", "🌞", "⚡", "🔥", 
  "🎵", "💤", "🎭"
];

const DIFFICULTY_MAP = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil"
};

// ======================
// DÍA ACTIVO (LOCAL)
// ======================

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Ejemplo: "2026-01-14"
}

function getRefKey() {
  return getTodayKey().replace(/-/g, ""); // Ejemplo: "20260114"
}

let DAY_KEY = localStorage.getItem("iconle-current-day");
const REAL_TODAY = getTodayKey();

if (!DAY_KEY || DAY_KEY !== REAL_TODAY) {
  // Si es un día nuevo, limpiamos el estado del juego anterior
  if (DAY_KEY) localStorage.removeItem(`iconle-${DAY_KEY}`);
  localStorage.setItem("iconle-current-day", REAL_TODAY);
  DAY_KEY = REAL_TODAY;
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
  if (!row) return;
  [...row.children].forEach((cell, i) => {
    cell.textContent = currentGuess[i] || "";
  });
}

function updateButtons() {
  checkBtn.disabled = (currentGuess.length !== 3 || finished);
}

function renderGuessResult(guess, rowIndex) {
  const row = board.children[rowIndex];
  if (!row) return;
  const solutionCopy = [...PUZZLE.solution];
  const resultClasses = Array(3).fill("gray");

  // Primero: Verdes (Coincidencia exacta)
  guess.forEach((icon, i) => {
    if (icon === solutionCopy[i]) {
      resultClasses[i] = "green";
      solutionCopy[i] = null;
    }
  });

  // Segundo: Amarillos (Existe en otra posición)
  guess.forEach((icon, i) => {
    if (resultClasses[i] === "green") return;
    const idx = solutionCopy.indexOf(icon);
    if (idx !== -1) {
      resultClasses[i] = "yellow";
      solutionCopy[idx] = null;
    }
  });

  // Aplicar clases a las celdas
  [...row.children].forEach((cell, i) => {
    cell.textContent = guess[i];
    cell.classList.add(resultClasses[i]);
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
    status.textContent = `¡Correcto! 🎉 La película era: ${PUZZLE.title_es}`;
    updateStats(true);
  } else {
    currentRow++;
    currentGuess = [];
    if (currentRow >= MAX_ATTEMPTS) {
      finished = true;
      status.textContent = `Fin del juego. La solución era: ${PUZZLE.solution.join(" ")}`;
      updateStats(false);
    }
  }

  saveState();
  updateButtons();
  shareBtn.disabled = !finished;
}

// ======================
// STORAGE & STATS
// ======================

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentRow, guesses, finished }));
}

function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  const state = JSON.parse(data);
  currentRow = state.currentRow;
  guesses = state.guesses;
  finished = state.finished;
  guesses.forEach((g, i) => renderGuessResult(g, i));
}

const STATS_KEY = "iconle-stats";

function getStats() {
  return JSON.parse(localStorage.getItem(STATS_KEY)) || {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0
  };
}

function updateStats(isWin) {
  const stats = getStats();
  stats.played++;
  if (isWin) {
    stats.wins++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const stats = getStats();
  if (statPlayed) statPlayed.textContent = stats.played;
  if (statWins) statWins.textContent = stats.wins;
  if (statStreak) statStreak.textContent = stats.currentStreak;
  if (statMaxStreak) statMaxStreak.textContent = stats.maxStreak;
}

// ======================
// SHARE
// ======================

shareBtn.onclick = () => {
  if (!finished) return;

  const attemptText = guesses.length <= MAX_ATTEMPTS && guesses[guesses.length-1].join("") === PUZZLE.solution.join("")
    ? `${guesses.length}/${MAX_ATTEMPTS}`
    : `X/${MAX_ATTEMPTS}`;

  const grid = guesses.map(guess => {
    const solCopy = [...PUZZLE.solution];
    const rowEmojis = Array(3).fill("⬛");

    guess.forEach((icon, i) => {
      if (icon === solCopy[i]) {
        rowEmojis[i] = "🟩";
        solCopy[i] = null;
      }
    });

    guess.forEach((icon, i) => {
      if (rowEmojis[i] === "🟩") return;
      const idx = solCopy.indexOf(icon);
      if (idx !== -1) {
        rowEmojis[i] = "🟨";
        solCopy[idx] = null;
      }
    });
    return rowEmojis.join("");
  }).join("\n");

  const text = `ICONLE ${DAY_KEY} (${attemptText})\n\n${grid}\n\n🎬 ${PUZZLE.title_en}\n🍿 ${PUZZLE.title_es}\nhttps://iconle.com\n#iconle`;

  if (navigator.share) {
    navigator.share({ text: text }).catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text);
  }
};

function copyToClipboard(text) {
  const temp = document.createElement("textarea");
  document.body.appendChild(temp);
  temp.value = text;
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
  status.textContent = "¡Copiado al portapapeles! 📋";
}

// ======================
// LOAD PUZZLE
// ======================

async function loadPuzzle() {
  try {
    const res = await fetch("puzzles.json");
    const puzzles = await res.json();
    
    const todayRef = getRefKey();
    PUZZLE = puzzles.find(p => p.ref === todayRef);

    // Fallback si no hay puzzle para hoy
    if (!PUZZLE) {
      console.warn("No hay puzzle para hoy, cargando el primero.");
      PUZZLE = puzzles[0];
    }

    titleEl.textContent = `${PUZZLE.title_es} / ${PUZZLE.title_en}`;
    diffEl.textContent = `Dificultad: ${DIFFICULTY_MAP[PUZZLE.difficulty]}`;
    
    initBoard();
    initKeyboard();
    loadState();
    updateButtons();
    renderStats();
    shareBtn.disabled = !finished;

  } catch (e) {
    console.error("Error cargando el puzzle:", e);
    status.textContent = "Error al cargar el juego. Revisa la consola.";
  }
}

loadPuzzle();
