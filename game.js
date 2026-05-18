// Load settings from session storage

const settings = JSON.parse(sessionStorage.getItem("settings"));

// if no settings
if (!settings) {
  alert("No settings found. Go back to launcher.");
  window.location.href = "index.html";
}

//player object

const player = {
  name: settings.playerName,
  bestScore: 0,
};

const savedBest = getCookie("bestScore");
if (savedBest) {
  player.bestScore = parseInt(savedBest);
}

function getPreviewTime() {
  if (settings.difficulty === "easy") return 2500;
  if (settings.difficulty === "medium") return 1500;
  return 800; //hard
}

//game state object
const gameState = {
  round: 0,
  score: 0,
  lives: 3,
  pattern: [],
  userPattern: [],
  gridSize: settings.gridSize,
  previewTime: getPreviewTime("settings.difficulty"),
  combo: 0, //Update adding system
};

//DOM Elements
const displayPlayer = document.getElementById("displayPlayer");
const displayRound = document.getElementById("displayRound");
const displayScore = document.getElementById("displayScore");
const displayLives = document.getElementById("displayLives");
const displayPreview = document.getElementById("displayPreview");
const displayBestScore = document.getElementById("displayBestScore");

const loadBtn = document.getElementById("loadBtn");
const messageArea = document.getElementById("messageArea");
const timerBar = document.getElementById("timerBar");
const gridArea = document.getElementById("gridArea");

//update
const gameOverModal = document.getElementById("gameOverModal");
const finalScoreText = document.getElementById("finalScoreText");
const bestScoreText = document.getElementById("bestScoreText");
const roundText = document.getElementById("roundText");
const playAgainBtn = document.getElementById("playAgainBtn");

//Display Initial Information
function updateDisplay() {
  displayPlayer.textContent = player.name;
  displayRound.textContent = gameState.round;
  displayScore.textContent = gameState.score;
  displayLives.textContent = gameState.lives;
  displayBestScore.textContent = player.bestScore;
  displayPreview.textContent = gameState.previewTime + " ms";
}

updateDisplay();

//Load Best Score from cookie
function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === name) return value;
  }
  return null;
}

//Symbol
function getRandomSymbol() {
  const symbols = ["★", "●", "▲", "■", "◆", "✦", "✿", "✖"];
  return symbols[Math.floor(Math.random() * symbols.length)];
}

//Creating the Grid
function createGrid() {
  gridArea.innerHTML = "";

  const size = gameState.gridSize;
  gridArea.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.classList.add("pattern-cell");
    cell.dataset.index = i;

    //Apply themes

    //Colours
    cell.addEventListener("click", handleCellClick);
    gridArea.appendChild(cell);

    //Symbols
    if (settings.theme === "symbols") {
      cell.textContent = getRandomSymbol();
      cell.classList.add("symbols");
    }

    //Lights
    if (settings.theme === "lights") {
      cell.classList.add("lights");
    }
  }
}

//Handle Cell Click
function handleCellClick(event) {
  if (!gameState.gameActive) return;

  const cell = event.target;
  const index = parseInt(cell.dataset.index);

  //Strict Mode
  if (settings.strictMode && !gameState.pattern.includes(index)) {
    gameState.lives--;

    messageArea.textContent = "Wrong title! (Strict Mode)";
    highlightCells("wrong");

    updateDisplay();
    addLog("Strict mode: wrong click (-1 life");

    if (gameState.lives <= 0) {
      gameOver();
    }
  }

  //Toggle selection
  if (cell.classList.contains("selected")) {
    cell.classList.remove("selected");
    gameState.userPattern = gameState.userPattern.filter((i) => i !== index);
  } else {
    cell.classList.add("selected");
    gameState.userPattern.push(index);
  }
  console.log("User pattern:", gameState.userPattern);
}

createGrid();

// Generate Pattern
function generatePattern() {
  gameState.pattern = [];

  const totalCells = gameState.gridSize * gameState.gridSize;

  //Base difficulty starting point update
  let baseLength;

  if (settings.difficulty === "easy") {
    baseLength = 2;
  } else if (settings.difficulty === "medium") {
    baseLength = 3;
  } else {
    baseLength = 4;
  }

  //Growth slows over time (every 2 rounds)
  const growth = Math.floor(gameState.round / 2);

  //Max pattern is based on grid size (Important)
  const maxLength = Math.floor(totalCells * 0.5);

  //Final length calculation
  let length = Math.min(maxLength, baseLength + growth);

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * totalCells);

    //Avoid duplicates
    if (!gameState.pattern.includes(randomIndex)) {
      gameState.pattern.push(randomIndex);
    } else {
      i--; //retry
    }
  }

  console.log("Pattern:", gameState.pattern);
}

//Show Pattern
function showPattern() {
  Array.from(gridArea.children).forEach((cell) => {
    cell.classList.remove("hint");
  });

  let timeLeft = gameState.previewTime;

  gameState.pattern.forEach((index) => {
    const cell = gridArea.children[index];

    //Base highlight
    cell.classList.add("preview");

    //Lights
    if (settings.theme === "lights") {
      cell.style.boxShadow = "0 0 15px yellow";
      cell.style.backgroundColor = "#444";
    }
  });

  //Timer Display - Update Improving Timer Display
  if (settings.showPreviewTime) {
    clearInterval(gameState.timerInterval);

    timerBar.style.transition = "none";
    timerBar.style.width = "100%";

    setTimeout(() => {
      timerBar.style.transition = "width 0.1s linear";
    }, 10);

    gameState.timerInterval = setInterval(() => {
      timeLeft -= 100;

      const percentage = (timeLeft / gameState.previewTime) * 100;
      timerBar.style.width = percentage + "%";

      if (timeLeft <= 0) {
        clearInterval(gameState.timerInterval);
      }
    }, 100);

    messageArea.textContent = "Memorise the pattern...";
  }

  //Hide after preview time
  setTimeout(hidePattern, gameState.previewTime);
}

//Hide Pattern
function hidePattern() {
  timerBar.style.width = "0%";

  Array.from(gridArea.children).forEach((cell) => {
    cell.classList.remove("preview");

    if (settings.theme === "lights") {
      cell.style.boxShadow = "none";
      cell.style.backgroundColor = "";
    }
  });

  //Change 1
  /* Old hint system
const hintCount = Math.max(1, Math.floor(gameState.pattern.length / 3));

const hintTiles = shuffledPattern.slice(0, hintCount);
*/

  //Replaced with smart difficulty-based hint system
  if (settings.showHints) {
    let hintCount;

    //Difficulty base hints
    if (settings.difficulty === "easy") {
      hintCount = Math.ceil(gameState.pattern.length * 0.4);
    } else if (settings.difficulty === "medium") {
      hintCount = Math.ceil(gameState.pattern.length * 0.25);
    } else {
      hintCount = 1;
    }

    // Reveal the START of the pattern
    const hintTiles = gameState.pattern.slice(0, hintCount);

    hintTiles.forEach((index) => {
      const cell = gridArea.children[index];
      cell.classList.add("hint");
    });
  }

  messageArea.textContent = "Now copy the pattern!";

  gameState.gameActive = true;
}

//Start Game
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", startGame);

function startGame() {
  gameState.round = 1;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.userPattern = [];
  gameState.combo = 0; //update combo system

  gameState.previewTime = getPreviewTime();

  gameState.gameActive = false;

  gridArea.innerHTML = "";
  createGrid();

  checkBtn.disabled = false;
  nextRoundBtn.disabled = true;

  clearSelections();

  updateDisplay();
  generatePattern();
  showPattern();

  setTimeout(() => {
    document.getElementById("gridArea").scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 200);

  addLog("Game started");
}

function clearSelections() {
  Array.from(gridArea.children).forEach((cell) => {
    cell.classList.remove("selected", "correct", "wrong", "hint");
  });
}

//Check Pattern Button
const checkBtn = document.getElementById("checkBtn");

checkBtn.addEventListener("click", checkPattern);

//Compare the Patterns
function checkPattern() {
  if (!gameState.gameActive) return;

  gameState.gameActive = false;

  const correct = arraysMatch(gameState.pattern, gameState.userPattern);

  if (correct) {
    handleCorrect();
  } else {
    handleWrong();
  }

  //Change 4: Unlock next round only after checking
  checkBtn.disabled = true;
  nextRoundBtn.disabled = false;
  //End Change 4
}

function arraysMatch(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  //Sort both arrays before comparing
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((val, index) => val === sorted2[index]);
}

const resultsArea = document.getElementById("resultsArea");

//Correct Answer
function handleCorrect() {
  let multiplier = 1;

  //Difficulty
  if (settings.difficulty === "easy") multiplier = 1;
  if (settings.difficulty === "medium") multiplier = 1.5;
  if (settings.difficulty === "hard") multiplier = 2;

  //Hint penalty
  if (settings.showHints) {
    multiplier *= 0.7; //reduce score;
  }

  //Strict bonus
  if (settings.strictMode) {
    multiplier *= 1.5; //Increase score
  }

  //Update
  const comboBonus = 1 + gameState.combo * 0.2;
  const basePoints = 10;

  const roundBonus = 1 + gameState.round * 0.15;

  const points = Math.round(basePoints * multiplier * comboBonus * roundBonus);
  
  gameState.score += points;
  gameState.combo++;

  let note = "";
  if (settings.showHints) note += " (Hints penalty)";
  if (settings.strictMode) note += " (Strict bonus)";

  const successMessages = [
    "Perfect!",
    "Excellent memory!",
    "Great job!",
    "Pattern matched!",
    "Nice work!",
    "Impressive!",
    "You got it!",
  ];

  const randomMessage =
    successMessages[Math.floor(Math.random() * successMessages.length)];

  if (gameState.combo >= 2) {
    messageArea.textContent = `${randomMessage} COMBO x${gameState.combo}!`;
  } else {
    messageArea.textContent = randomMessage;
  }

  highlightCells("correct");

  updateDisplay();

  resultsArea.textContent =
    `Round ${gameState.round}\n` +
    `Results: Correct\n` +
    `Combo: x${gameState.combo}\n` +
    `Points: +${points}\n` +
    `Total Score: ${gameState.score}`;

  addLog(
    `Round ${gameState.round}: Correct (+${points}) | Combo x${gameState.combo}`,
  );
}

//Wrong Answer
function handleWrong() {
  if (gameState.lives <= 0) return;

  const failMessages = [
    "Not quite!",
    "Wrong Pattern",
    "Try again!",
    "Almost had it!",
    "Pattern mismatch",
    "Careful!",
  ];

  messageArea.textContent =
    failMessages[Math.floor(Math.random() * failMessages.length)];

  gameState.lives--;
  gameState.combo = 0;

  highlightCells("wrong");

  //Update
  gridArea.style.animation = "shake 0.35s";

  setTimeout(() => {
    gridArea.style.animation = "";
  }, 350);

  updateDisplay();

  resultsArea.textContent = `Round ${gameState.round}: Incorrect!`;

  addLog(`Round ${gameState.round}: Wrong (-1 life)`);

  if (gameState.lives <= 0) {
    addLog(`Lives remaining: ${gameState.lives}`);
    gameOver();
  }
}

//Highlight Cells
function highlightCells(type) {
  gameState.pattern.forEach((index) => {
    const cell = gridArea.children[index];
    cell.classList.add(type);
  });
}

//Game Over
function gameOver() {
  gameState.gameActive = false;

  setGameButtonsDisabled(true);

  if (gameState.score > player.bestScore) {
    player.bestScore = gameState.score;
    document.cookie = `bestScore=${player.bestScore}`;
  }

  finalScoreText.textContent = `Final Score: ${gameState.score}`;
  bestScoreText.textContent = `Best Score: ${player.bestScore}`;
  roundText.textContent = `Rounds Survived: ${gameState.round}`;

  gameOverModal.classList.remove("hidden");

  //Change 2: Added leaderboard storage system
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  //End Change 2

  leaderboard.push({
    name: player.name,
    score: gameState.score,
    difficulty: settings.difficulty,
    gridSize: gameState.gridSize,
    round: gameState.round,
    date: new Date().toLocaleString(),
  });

  //Change 2: Save score to leaderboard
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  //End Change 2

  console.log(localStorage.getItem("leaderboard"));

  addLog(`Game over - Score: ${gameState.score}`);

  resetGame();
}

//Reset Game
const resetBtn = document.getElementById("resetBtn");

resetBtn.addEventListener("click", () => {
  if (confirm("Reset game?")) {
    resetGame();
  }
});

function resetGame() {
  gameState.round = 0;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.pattern = [];
  gameState.userPattern = [];

  clearSelections();
  updateDisplay();

  messageArea.textContent = "Game reset. Click Start Game.";
}

//Next Round
const nextRoundBtn = document.getElementById("nextRoundBtn");

nextRoundBtn.addEventListener("click", nextRound);

function nextRound() {
  if (gameState.lives <= 0) return;

  gameState.round++;
  gameState.userPattern = [];
  gameState.gameActive = false;

  //Change 4: Prevent skipping rounds
  checkBtn.disabled = false;
  nextRoundBtn.disabled = true;
  //End Change 4

  const basePreview = getPreviewTime();

  gameState.previewTime = Math.max(400, basePreview - gameState.round * 35);

  clearSelections();

  generatePattern();
  showPattern();

  setTimeout(() => {
    document.getElementById("gridArea").scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 200);

  updateDisplay();

  addLog(`Round ${gameState.round} started`);
}

//Save Session
const saveBtn = document.getElementById("saveBtn");

saveBtn.addEventListener("click", saveSession);

function saveSession() {
  const saveData = {
    gameState,
    player,
  };

  sessionStorage.setItem("gameSave", JSON.stringify(saveData));

  document.cookie = `playerName${player.name}`;
  document.cookie = `bestScore=${player.bestScore}`;

  addLog("Game saved");
  alert("Game saved!");
}

//Load Session
function loadSession() {
  const data = sessionStorage.getItem("gameSave");

  if (!data) {
    alert("No saved session found!");
    return;
  }

  const parsed = JSON.parse(data);

  Object.assign(gameState, parsed.gameState);
  Object.assign(player, parsed.player);

  gameState.userPattern = [];
  gameState.gameActive = false;

  gridArea.innerHTML = "";
  createGrid();

  updateDisplay();

  messageArea.textContent = "Session loaded. Ready to continue.";
  resultsArea.textContent = "";

  clearSelections();

  addLog(`Session loaded (Round ${gameState.round})`);

  alert("Session loaded!");
}
loadBtn.addEventListener("click", () => {
  console.log("LOAD BUTTON CLICKED");
  loadSession();
});

//Back Button
const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

//Game Logs
const logArea = document.getElementById("logArea");

function addLog(message) {
  const entry = document.createElement("div");
  entry.classList.add("log-entry");

  const time = new Date().toLocaleTimeString();

  entry.textContent = `[${time}] ${message}`;

  logArea.prepend(entry);

  console.log("LOG:", message);
}

function setGameButtonsDisabled(state) {
  checkBtn.disabled = state;
  nextRoundBtn.disabled = state;
}

playAgainBtn.addEventListener("click", () => {
  gameOverModal.classList.add("hidden");
  resetGame();
});
