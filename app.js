document.addEventListener("DOMContentLoaded", () => {

// ======================
// CONFIGURACIÓN
// ======================

const MAX_ATTEMPTS = 6;
const START_DATE = new Date("2026-01-14T00:00:00");
START_DATE.setHours(0,0,0,0);

const ICONS = [
  "👦","🧔","👩","👸","🧙‍♂️","🦸‍♂️","👻",
  "🦖","🦁","🐵","🦇","🕷️","🐺","🐍","🐟","🦈","🐀",
  "🚗","🚢","✈️","🚀","🚲","🛸",
  "🏝️","🏰","🏜️","🏙️","🏠","🌌","🌲","❄️","🌋",
  "🔫","🎬","🎩","⚔️","💎","💰","💍","🍎","💊","📖","📞",
  "❤️","💀","👑","🌊","🌕","🌞","⚡","🔥","🎵","💤","🎭"
];

const DIFFICULTY_MAP = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil"
};

// ======================
// DÍA ACTIVO
// ======================

function getDayIndex() {
  const today = new Date();
  today.setHours(0,0,0,0);
  return Math.floor((today - START_DATE) / 86400000);
}

const DAY_INDEX = Math.max(0, getDayIndex());
const STORAGE_KEY = `iconle-day-${DAY_INDEX}`;

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
    key.onclick = () => onKey(icon);
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
    cell.classList.add(idx !== -1 ? "yellow" : "gray");
    if (idx !== -1) solutionCopy[idx] = null;
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
    status.textContent = `¡Correcto! 🎉`;
    updateStats(true);
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
    status.textContent = `Fin del juego. Solución: ${PUZZLE.solution.join(" ")}`;
    updateStats(false);
    saveState();
    shareBtn.disabled = false;
  }
}

// ======================
// STORAGE
// ======================

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentRow, guesses, finished }));
}

function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  const s = JSON.parse(data);
  currentRow = s.currentRow;
  guesses = s.guesses;
  finished = s.finished;
  guesses.forEach(renderGuessResult);
}

// ======================
// STATS
// ======================

const STATS_KEY = "iconle-stats";

function getStats() {
  return JSON.parse(localStorage.getItem(STATS_KEY)) || {
    played: 0, wins: 0, currentStreak: 0, maxStreak: 0
  };
}

function updateStats(win) {
  const s = getStats();
  s.played++;
  if (win) {
    s.wins++;
    s.currentStreak++;
    s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
  } else {
    s.currentStreak = 0;
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
  renderStats();
}

function renderStats() {
  const s = getStats();
  statPlayed.textContent = s.played;
  statWins.textContent = s.wins;
  statStreak.textContent = s.currentStreak;
  statMaxStreak.textContent = s.maxStreak;
}

// ======================
// LOAD PUZZLE
// ======================

async function loadPuzzle() {
  const res = await fetch("puzzles.json");
  const puzzles = await res.json();

  PUZZLE = puzzles[DAY_INDEX];
  if (!PUZZLE) {
    status.textContent = "No hay acertijo disponible para hoy.";
    return;
  }

  titleEl.textContent = `${PUZZLE.title_es} / ${PUZZLE.title_en}`;
  diffEl.textContent = `Dificultad: ${DIFFICULTY_MAP[PUZZLE.difficulty]}`;

  initBoard();
  initKeyboard();
  loadState();
  renderStats();
  updateButtons();
}

loadPuzzle();

});
