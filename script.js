import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Firebase Config
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

// Start page
startBtn.addEventListener('click', () => {
  document.getElementById('start-page').style.display = 'none';
  document.getElementById('username-page').style.display = 'flex';
});

// Username page
playBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (!username) return alert('Enter username');
  document.getElementById('username-page').style.display = 'none';
  document.getElementById('level-select-page').style.display = 'flex';
});

// Level selection
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

// Start Game
function startGame(levelName){
  gameArea.innerHTML = '';
  timer = 0;
  magePos = findCell('S');
  renderGrid();

  // Place mage
  getCell(magePos.x, magePos.y).appendChild(makeImage('mage.png'));

  // Place goal
  const goalPos = findCell('E');
  getCell(goalPos.x, goalPos.y).appendChild(makeImage('goal.png'));

  document.addEventListener('keydown', handleMovement);

  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    timer+=0.1;
    timerDisplay.textContent = `Time: ${timer.toFixed(1)}s`;
  },100);
}

// Render grid
function renderGrid(){
  currentLevelMatrix.forEach((row,y)=>{
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');
    row.forEach((cell,x)=>{
      const cellDiv = document.createElement('div');
      cellDiv.classList.add('cell');
      cellDiv.dataset.x = x;
      cellDiv.dataset.y = y;
      if(cell==='W' || cell==='1') cellDiv.classList.add('wall');
      rowDiv.appendChild(cellDiv);
    });
    gameArea.appendChild(rowDiv);
  });
}

// Helpers
function findCell(symbol){
  for(let y=0;y<currentLevelMatrix.length;y++){
    for(let x=0;x<currentLevelMatrix[y].length;x++){
      if(currentLevelMatrix[y][x]===symbol) return {x,y};
    }
  }
  return null;
}

function getCell(x,y){
  return gameArea.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

function makeImage(filename){
  const img = document.createElement('img');
  img.src = `assets/${filename}`;
  img.alt = filename;
  return img;
}

// Movement
function handleMovement(e){
  const moves = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
  if(!moves[e.key]) return;
  const [dx,dy] = moves[e.key];
  const newX = magePos.x + dx;
  const newY = magePos.y + dy;

  if(newY<0||newY>=currentLevelMatrix.length||newX<0||newX>=currentLevelMatrix[0].length) return;

  const nextCellValue = currentLevelMatrix[newY][newX];
  if(nextCellValue==='W' || nextCellValue==='1') return; // wall

  const currentCell = getCell(magePos.x,magePos.y);
  const nextCell = getCell(newX,newY);
  const mageImg = currentCell.querySelector('img');
  if(mageImg){
    nextCell.appendChild(mageImg);
    magePos={x:newX,y:newY};

    if(nextCellValue==='E') endGame();
  }
}

// End game
function endGame(){
  clearInterval(timerInterval);
  document.removeEventListener('keydown', handleMovement);
  saveScore(username,getCurrentLevelName(),parseFloat(timer.toFixed(1)));
}

// Current level name
function getCurrentLevelName(){
  return Object.entries(levels).find(([,matrix])=>matrix===currentLevelMatrix)[0];
}

// Save score to Firestore
async function saveScore(username,level,time){
  const docRef = doc(db,'scores',`${username}_${level}`);
  const docSnap = await getDoc(docRef);
  if(!docSnap.exists()||time<docSnap.data().time){
    await setDoc(docRef,{username,level,time,updated:new Date()});
  }
  showLeaderboard(level);
}

// Show leaderboard
async function showLeaderboard(level){
  leaderboard.innerHTML='<h2>Leaderboard</h2>';
  const q = query(collection(db,'scores'),orderBy('time','asc'));
  const snapshot = await getDocs(q);
  let html='<table><tr><th>Rank</th><th>Username</th><th>Time(s)</th></tr>';
  let rank=1;
  snapshot.forEach(doc=>{
    const data = doc.data();
    if(data.level===level){
      html+=`<tr><td>${rank++}</td><td>${data.username}</td><td>${data.time}</td></tr>`;
    }
  });
  html+='</table>';
  leaderboard.innerHTML+=html;
  leaderboard.style.display='block';
  gameArea.style.display='none';
}

// Footer
footer.innerHTML=`Built by @xiipher <img

