// Firebase and game initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

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

// ======= DOM Elements =======
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
let magePos = {x: 0, y: 0};

// ======= Views Flow =======
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
    currentLevel = btn.dataset.level;
    gridSize = currentLevel === 'easy' ? 3 : currentLevel === 'medium' ? 4 : 5;
    startGame();
  });
});

// ======= Game Logic =======
function startGame() {
  document.getElementById('level-select-page').style.display = 'none';
  gameArea.innerHTML = '';
  timerDisplay.innerText = '0';
  timer = 0;

  // Build grid
  let grid = [];
  for (let y = 0; y < gridSize; y++) {
    const row = document.createElement('div');
    row.classList.add('row');
    grid.push([]);
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.setAttribute('data-x', x);
      cell.setAttribute('data-y', y);
      if (x === 0 && y === 0) cell.classList.add('start');
      if (x === gridSize - 1 && y === gridSize - 1) cell.classList.add('goal');
      row.appendChild(cell);
      grid[y].push(cell);
    }
    gameArea.appendChild(row);
  }

  // Place mage
  magePos = { x: 0, y: 0 };
  grid.appendChild(makeImage('mage.png', 'mage'));
  grid[gridSize-1][gridSize-1].appendChild(makeImage('goal.png', 'goal'));
  gameArea.style.display = 'block';

  // Handle movement
  document.addEventListener('keydown', handleMovement);

  // Start timer
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.innerText = timer;
  }, 1000);
}

function makeImage(src, className) {
  const img = document.createElement('img');
  img.src = 'assets/' + src;
  img.className = className;
  return img;
}

function handleMovement(e) {
  const dirs = {
    'ArrowUp': { dx: 0, dy: -1 },
    'ArrowDown': { dx: 0, dy: 1 },
    'ArrowLeft': { dx: -1, dy: 0 },
    'ArrowRight': { dx: 1, dy: 0 }
  };
  if (!dirs[e.key]) return;

  let nx = magePos.x + dirs[e.key].dx;
  let ny = magePos.y + dirs[e.key].dy;
  if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) return;
  const curCell = document.querySelector(`.cell[data-x="${magePos.x}"][data-y="${magePos.y}"]`);
  const nextCell = document.querySelector(`.cell[data-x="${nx}"][data-y="${ny}"]`);
  const mageImg = curCell.querySelector('.mage');
  if (mageImg) {
    nextCell.appendChild(mageImg);
  }
  magePos = { x: nx, y: ny };

  if (nx === gridSize - 1 && ny === gridSize - 1) {
    endGame();
  }
}

function endGame() {
  clearInterval(timerInterval);
  document.removeEventListener('keydown', handleMovement);
  saveScore(username, currentLevel, timer);
}

// ======= Firebase Leaderboard =======
async function saveScore(username, level, time) {
  await addDoc(collection(db, 'scores'), {
    username: username,
    level: level,
    time: time,
    created: new Date()
  });
  showLeaderboard(level);
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
    let data = doc.data();
    if (data.level === level)
      html += `<tr><td>${rank++}</td><td>${data.username}</td><td>${data.time}</td></tr>`;
  });
  html += '</table>';
  leaderboard.innerHTML += html;
  leaderboard.style.display = 'block';
}

footer.innerHTML = `Built by @xiipher <img src="assets/logo.png" alt="Anoma logo" /> Intent Games`;
