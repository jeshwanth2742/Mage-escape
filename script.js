import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Firebase config
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

let currentLevelMatrix = null;
let magePos = { x: 0, y: 0 };
let username = '';
let timer = 0;
let timerInterval = null;

// Maze matrices (0 = path, 1 = wall)
const levels = {
  easy: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 1]
  ],
  medium: [
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 0, 1],
    [0, 0, 1, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
  ],
  hard: [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

// Start page
startBtn.addEventListener('click', () => {
  document.getElementById('start-page').style.display = 'none';
  document.getElementById('username-page').style.display = 'flex';
});

playBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (!username) return alert('Enter username');
  document.getElementById('username-page').style.display = 'none';
  document.getElementById('level-select-page').style.display = 'flex';
});

levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const levelName = btn.dataset.level;
    currentLevelMatrix = levels[levelName];
    document.getElementById('level-select-page').style.display = 'none';
    gameArea.style.display = 'block';
    leaderboard.style.display = 'none';
    startGame(levelName);
  });
});

function startGame(levelName) {
  drawMaze();
  placeMage();
  placeGoal();
  timer = 0;
  timerInterval = setInterval(() => {
    timer += 0.1;
    timerDisplay.textContent = `Time: ${timer.toFixed(1)}s`;
  }, 100);
  document.addEventListener('keydown', moveMage);
}

function drawMaze() {
  gameArea.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const cellSize = canvas.width / currentLevelMatrix.length;

  for (let y = 0; y < currentLevelMatrix.length; y++) {
    for (let x = 0; x < currentLevelMatrix[y].length; x++) {
      if (currentLevelMatrix[y][x] === 1) {
        ctx.fillStyle = "#222"; // wall color
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else {
        ctx.fillStyle = "#fafafa"; // path color
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  gameArea.appendChild(canvas);
}

function placeMage() {
  magePos = { x: 0, y: 1 }; // start on first available path
}

function placeGoal() {
  const goalImg = document.createElement('img');
  goalImg.src = 'assets/goal.png';
  goalImg.classList.add('goal');
  gameArea.appendChild(goalImg);
}

function moveMage(e) {
  // Implement movement logic based on 0-paths only
}

// Save score / leaderboard logic remains same as previous version...
footer.innerHTML = `Built by @xiipher <img src="assets/logo.png" alt="Anoma logo" height="24"/> Intent Games`;

