// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ---- Firebase config ----
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

// ---- Canvas Setup ----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// ---- Game Variables ----
let mage = { x: 100, y: 100, speed: 2 };
let goal = { x: 700, y: 500, radius: 20 };
let timer = 0;
let timerInterval;
let gameStarted = false;
let username = "";

// ---- Define Maze Paths as Arrays of Points ----
const paths = [
  [ {x:100,y:100}, {x:200,y:120}, {x:300,y:200}, {x:400,y:300}, {x:500,y:350}, {x:600,y:450}, {x:700,y:500} ]
  // Add more branching paths if desired
];

// ---- Draw Maze Lines ----
function drawMaze() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#333";
  paths.forEach(path => {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for(let i=1;i<path.length;i++){
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  });

  // Draw goal
  const goalImg = new Image();
  goalImg.src = "assets/goal.png";
  ctx.drawImage(goalImg, goal.x - 20, goal.y - 20, 40, 40);

  // Draw mage
  const mageImg = new Image();
  mageImg.src = "assets/mage.png";
  ctx.drawImage(mageImg, mage.x - 20, mage.y - 20, 40, 40);
}

// ---- Mage Movement ----
const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };

document.addEventListener("keydown", e => { if(keys.hasOwnProperty(e.key)) keys[e.key]=true; });
document.addEventListener("keyup", e => { if(keys.hasOwnProperty(e.key)) keys[e.key]=false; });

function moveMage() {
  if(!gameStarted) return;

  // Simple free-line movement (constrained near nearest path)
  if(keys.ArrowUp) mage.y -= mage.speed;
  if(keys.ArrowDown) mage.y += mage.speed;
  if(keys.ArrowLeft) mage.x -= mage.speed;
  if(keys.ArrowRight) mage.x += mage.speed;

  // Constrain mage near path
  paths.forEach(path => {
    path.forEach(pt => {
      const dx = pt.x - mage.x;
      const dy = pt.y - mage.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 10){
        mage.x = pt.x;
        mage.y = pt.y;
      }
    });
  });

  // Check goal
  const dx = goal.x - mage.x;
  const dy = goal.y - mage.y;
  if(Math.sqrt(dx*dx + dy*dy) < goal.radius){
    endGame();
  }
}

// ---- Timer Functions ----
function startTimer() {
  timer = 0;
  timerInterval = setInterval(()=>{ timer+=0.1; timer = Math.round(timer*10)/10; },100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// ---- Game Start ----
document.getElementById("startBtn").addEventListener("click", ()=>{
  username = document.getElementById("usernameInput").value.trim();
  if(!username){ alert("Enter your username!"); return; }

  gameStarted = true;
  startTimer();
  requestAnimationFrame(gameLoop);
});

// ---- Game Loop ----
function gameLoop() {
  moveMage();
  drawMaze();
  if(gameStarted) requestAnimationFrame(gameLoop);
}

// ---- Game End ----
async function endGame() {
  gameStarted = false;
  stopTimer();
  alert(`Congrats ${username}! Time: ${timer}s`);
  await saveScore(username, timer);
  await showLeaderboard();
}

// ---- Firebase: Save Score ----
async function saveScore(username, time){
  const userRef = doc(db, "scores", username);
  const userSnap = await getDoc(userRef);
  if(userSnap.exists()){
    const prevTime = userSnap.data().time;
    if(time < prevTime){
      await setDoc(userRef, { username, time, timestamp: new Date() });
    }
  } else {
    await setDoc(userRef, { username, time, timestamp: new Date() });
  }
}

// ---- Firebase: Show Top 5 Leaderboard ----
async function showLeaderboard(){
  const leaderboardDiv = document.getElementById("leaderboardDiv");
  leaderboardDiv.innerHTML = "<h2>Top 5 Players</h2>";
  const q = query(collection(db, "scores"), orderBy("time","asc"), limit(5));
  const querySnapshot = await getDocs(q);
  let rank = 1;
  querySnapshot.forEach(doc => {
    const data = doc.data();
    leaderboardDiv.innerHTML += `<p>${rank}. ${data.username} - ${data.time}s</p>`;
    rank++;
  });
  leaderboardDiv.innerHTML += `<button onclick="location.reload()">Play Again</button>`;
}
