import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCiKGqhSSCVQ3GPtnMA1DZSzemXLWoBM1M",
  authDomain: "preepclicker.firebaseapp.com",
  projectId: "preepclicker",
  storageBucket: "preepclicker.firebasestorage.app",
  messagingSenderId: "108481604",
  appId: "1:108481604:web:d5064e43d4eb6abd68c011",
  measurementId: "G-HV0WFYR4CB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const levels = {
  easy: [
    ['S', '', ''],
    ['', '', ''],
    ['', '', 'E']
  ],
  medium: [
    ['S', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', 'E']
  ],
  hard: [
    ['S', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', 'E']
  ]
};

// DOM elements
const startBtn = document.getElementById('start-btn');
const usernameInput = document.getElementById('username-input');
const playBtn = document.getElementById('play-btn');
const levelBtns = document.querySelectorAll('.level-btn');
const gameArea = document.getElementById('game-area');
const timerDisplay = document.getElementById('timer');
const leaderboard = document.getElementById('leaderboard');
const footer = document.getElementById('footer');

let currentLevelMatrix = null;
let magePos = { x: 0, y: 0 };
let username = '';
let timer = 0;
let timerInterval = null;

startBtn.addEventListener('click', () => {
  document.getElementById('start-page').style.display = 'none';
  document.getElementById('username-page').style.display = 'block';
});

playBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (!username) return alert('Please enter a username.');
  document.getElementById('username-page').style.display = 'none';
  document.getElementById('level-select-page').style.display = 'block';
});

levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const levelName = btn.dataset.level;
    currentLevelMatrix = levels[levelName];
    document.getElementById('level-select-page').style.display = 'none';
    gameArea.style.display = 'block';
    leaderboard.style.display = 'none';
    startGame();
  });
});

function startGame() {
  gameArea.innerHTML = ''; // Clear grid
  timerDisplay.textContent = '0';
  timer = 0;
  magePos = findCell('S');

  // Create grid based on level matrix
  currentLevelMatrix.forEach((row, y) => {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');
    row.forEach((cell, x) => {
      const cellDiv = document.createElement('div');
      cellDiv.classList.add('cell');
      cellDiv.dataset.x = x;
      cellDiv.dataset.y = y;

      if (cell === 'S') cellDiv.classList.add('start');
      if (cell === 'E') cellDiv.classList.add('goal');

      rowDiv.appendChild(cellDiv);
    });
    gameArea.appendChild(rowDiv);
  });

  // Place mage img on start cell
  const startCell = getCell(magePos.x, magePos.y);
  startCell.appendChild(makeImage('mage.png', 'mage'));

  // Place goal img on goal cell
  const goalPos = findCell('E');
  getCell(goalPos.x, goalPos.y).appendChild(makeImage('goal.png', 'goal'));

  // Attach movement listener
  document.addEventListener('keydown', handleMovement);

  // Start timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = timer;
  }, 1000);
}

// Find coordinates of a cell with specific symbol in matrix
function findCell(symbol) {
  for (let y = 0; y < currentLevelMatrix.length; y++) {
    for (let x = 0; x < currentLevelMatrix[y].length; x++) {
      if (currentLevelMatrix[y][x] === symbol) return { x, y };
    }
  }
  return null;
}

function getCell(x, y) {
  return gameArea.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

function makeImage(src, className) {
  const img = document.createElement('img');
  img.src = `assets/${src}`;
  img.className = className;
  img.alt = className;
  return img;
}

function handleMovement(e) {
  const directions = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 }
  };

  if (!directions[e.key]) return;

  const newX = magePos.x + directions[e.key].dx;
  const newY = magePos.y + directions[e.key].dy;

  // Boundary check
  if (
    newY < 0 ||
    newY >= currentLevelMatrix.length ||
    newX < 0 ||
    newX >= currentLevelMatrix[0].length
  )
    return;

  // Move mage image if target cell exists
  const currentCell = getCell(magePos.x, magePos.y);
  const nextCell = getCell(newX, newY);
  if (currentCell && nextCell) {
    const mageImg = currentCell.querySelector('.mage');
    if (mageImg) {
      nextCell.appendChild(mageImg);
      magePos = { x: newX, y: newY };

      if (currentLevelMatrix[newY][newX] === 'E') {
        endGame();
      }
    }
  }
}

function endGame() {
  clearInterval(timerInterval);
  document.removeEventListener('keydown', handleMovement);
  saveScore(username, getCurrentLevelName(), timer);
}

function getCurrentLevelName() {
  return Object.entries(levels).find(([, matrix]) => matrix === currentLevelMatrix)[0];
}

async function saveScore(username, level, time) {
  try {
    await addDoc(collection(db, 'scores'), {
      username,
      level,
      time,
      created: new Date()
    });
    showLeaderboard(level);
  } catch (err) {
    alert('Error saving score: ' + err.message);
  }
}

async function showLeaderboard(level) {
  leaderboard.innerHTML = '<h2>Leaderboard</h2>';
  const q = query(
    collection(db, 'scores'),
    orderBy('time', 'asc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  let html = '<table><tr><th>Rank</th><th>Username</th><th>Time (s)</th></tr>';
  let rank = 1;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.level === level) {
      html += `<tr><td>${rank++}</td><td>${data.username}</td><td>${data.time}</td></tr>`;
    }
  });
  html += '</table>';
  leaderboard.innerHTML += html;
  leaderboard.style.display = 'block';
  gameArea.style.display = 'none';
}

footer.innerHTML = `Built by @xiipher <img src="assets/logo.png" alt="Anoma logo" height="24" /> Intent Games`;

