// -----------------------------
// Firebase Setup
// -----------------------------
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, query, orderByChild, limitToFirst, get } from "firebase/database";

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
const db = getDatabase(app);

// -----------------------------
// Game Variables
// -----------------------------
let username;
let startTime;
let magePosition = { x: 0, y: 0 };
let currentLevelMatrix;

// -----------------------------
// Level Definitions
// -----------------------------
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
    ['S','','','',''],
    ['','','','',''],
    ['','','','',''],
    ['','','','',''],
    ['','','','','E']
  ]
};

// -----------------------------
// Start Page & Username Logic
// -----------------------------
document.getElementById('start-game-btn').addEventListener('click', () => {
  document.getElementById('start-page').style.display = 'none';
  document.getElementById('username-page').style.display = 'block';
});

document.getElementById('username-submit').addEventListener('click', () => {
  username = document.getElementById('username-input').value.trim();
  if(username) {
    document.getElementById('username-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'block';
  } else {
    alert('Please enter a username');
  }
});

// -----------------------------
// Start Level
// -----------------------------
window.startLevel = function(level) {
  currentLevelMatrix = levels[level];
  generateGrid(currentLevelMatrix);
  startTime = Date.now();
}

// -----------------------------
// Generate Grid
// -----------------------------
function generateGrid(matrix) {
  const area = document.getElementById('game-area');
  area.innerHTML = '';

  matrix.forEach((row, y) => {
    const divRow = document.createElement('div');
    divRow.className = 'row';

    row.forEach((cell, x) => {
      const divCell = document.createElement('div');
      divCell.className = 'cell';

      if(cell === 'S') {
        divCell.classList.add('mage');
        magePosition = { x, y };
        divCell.innerHTML = `<img src="assets/mage.png" alt="Mage">`;
      }

      if(cell === 'E') {
        divCell.classList.add('goal');
        divCell.innerHTML = `<img src="assets/goal.png" alt="Goal">`;
      }

      divRow.appendChild(divCell);
    });

    area.appendChild(divRow);
  });
}

// -----------------------------
// Mage Movement
// -----------------------------
document.addEventListener('keydown', (e) => {
  if(!currentLevelMatrix) return;

  let { x, y } = magePosition;
  if(e.key === 'ArrowUp') y--;
  else if(e.key === 'ArrowDown') y++;
  else if(e.key === 'ArrowLeft') x--;
  else if(e.key === 'ArrowRight') x++;

  if(canMove(x, y)) {
    moveMage(x, y);
    magePosition = { x, y };
    checkExit(x, y);
  }
});

function canMove(x, y) {
  return (
    y >= 0 &&
    x >= 0 &&
    y < currentLevelMatrix.length &&
    x < currentLevelMatrix[0].length
  );
}

function moveMage(x, y) {
  const area = document.getElementById('game-area');
  area.querySelectorAll('.row').forEach((row, rowIndex) => {
    row.querySelectorAll('.cell').forEach((cell, colIndex) => {
      cell.classList.remove('mage');
      cell.innerHTML = '';

      if(currentLevelMatrix[rowIndex][colIndex] === 'E') {
        cell.classList.add('goal');
        cell.innerHTML = `<img src="assets/goal.png" alt="Goal">`;
      }

      if(rowIndex === y && colIndex === x) {
        cell.classList.add('mage');
        cell.innerHTML = `<img src="assets/mage.png" alt="Mage">`;
      }
    });
  });
}

// -----------------------------
// Check Exit
// -----------------------------
function checkExit(x, y) {
  if(currentLevelMatrix[y][x] === 'E') {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    alert(`You solved the level in ${totalTime}s!`);
    saveToLeaderboard(username, totalTime);
  }
}

// -----------------------------
// Firebase Leaderboard
// -----------------------------
function saveToLeaderboard(username, time) {
  const leaderboardRef = ref(db, 'mageEscapeLeaderboard');
  push(leaderboardRef, { username, time }).then(() => updateLeaderboard());
}

async function updateLeaderboard() {
  const leaderboardRef = ref(db, 'mageEscapeLeaderboard');
  const q = query(leaderboardRef, orderByChild('time'), limitToFirst(20));
  const snapshot = await get(q);

  const leaderboardEl = document.getElementById('leaderboard');
  leaderboardEl.innerHTML = '';

  snapshot.forEach(child => {
    const data = child.val();
    const li = document.createElement('li');
    li.textContent = `${data.username} - ${data.time}s`;
    leaderboardEl.appendChild(li);
  });
}

// -----------------------------
// Timer Display
// -----------------------------
setInterval(() => {
  if(startTime) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    document.getElementById('timer').innerText = `Time: ${elapsed}s`;
  }
}, 100);

// Initial Leaderboard Load
updateLeaderboard();
