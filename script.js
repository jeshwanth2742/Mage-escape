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

// DOM Elements
const startBtn = document.getElementById('start-btn');
const usernameInput = document.getElementById('username-input');
const playBtn = document.getElementById('play-btn');
const levelBtns = document.querySelectorAll('.level-btn');
const gameArea = document.getElementById('game-area');
const timerDisplay = document.getElementById('timer');
const leaderboard = document.getElementById('leaderboard');
const footer = document.getElementById('footer');

let currentLevel = null;
let gridSize = 3;
let username = '';
let timer = 0;
let timerInterval = null;
let magePos = { x: 0, y: 0 };

// Event Listeners for navigation
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

levelBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentLevel = btn.dataset.level;
    gridSize = currentLevel === 'easy' ? 3 : currentLevel === 'medium' ? 4 : 5;
    document.getElementById('level-select-page').style.display = 'none';
    gameArea.style.display = 'block';
    leaderboard.style.display = 'none';
    startGame();
  });
});

// Game setup and logic
function startGame() {
  gameArea.innerHTML = ''; // Clear any existing grid
  timerDisplay.textContent = '0';
  timer = 0;
  magePos = { x: 0, y: 0 };

  // Create grid
  for (let y = 0; y < gridSize; y++) {
    const row = document.createElement('div');
    row.classList.add('row');
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;

      if (x === 0 && y === 0) cell.classList.add('start');
      if (x === gridSize - 1 && y === gridSize - 1) cell.classList.add('goal');
      row.appendChild(cell);
    }
    gameArea.appendChild(row);
  }

  // Place mage and goal images
  const startCell = document.querySelector('.cell.start');
  const goalCell = document.querySelector('.cell.goal');

  startCell.appendChild(makeImage('mage.png', 'mage'));
  goalCell.appendChild(makeImage('goal.png', 'goal'));

  // Start listening to key presses
  document.addEventListener('keydown', handleMovement);

  // Start timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = timer;
  }, 1000);
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

  let nx = magePos.x + directions[e.key].dx;
  let ny = magePos.y + directions[e.key].dy;

  if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) return;

  const currentCell = document.querySelector(`.cell[data-x="${magePos.x}"][data-y="${magePos.y}"]`);
  const nextCell = document.querySelector(`.cell[data-x="${nx}"][data-y="${ny}"]`);
  const mageImg = currentCell.querySelector('.mage');

  if (mageImg) {
    nextCell.appendChild(mageImg);
    magePos = { x: nx, y: ny };

    // Check for goal reached
    if (nx === gridSize - 1 && ny === gridSize - 1) {
      endGame();
    }
  }
}

function endGame() {
  clearInterval(timerInterval);
  document.removeEventListener('keydown', handleMovement);
  saveScore(username, currentLevel, timer);
}

async function saveScore(username, level, time) {
  try {
    await addDoc(collection(db, 'scores'), {
      username: username,
      level: level,
      time: time,
      created: new Date()
    });
    showLeaderboard(level);
  } catch (error) {
    alert('Error saving score: ' + error.message);
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

  snapshot.forEach((doc) => {
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

// Footer branding
footer.innerHTML = `Built by @xiipher <img src="assets/logo.png" alt="Anoma logo" height="24"/> Intent Games`;

