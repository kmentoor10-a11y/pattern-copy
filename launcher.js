// DOM elements

const playerNameInput = document.getElementById("playerName");
const difficultySelect = document.getElementById("difficulty");
const gridSizeSelect = document.getElementById("gridSize");
const previewText = document.getElementById("previewText");

const openGameBtn = document.getElementById("openGameBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const loadSettingsBtn = document.getElementById("loadSettingsBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const instructionsBtn = document.getElementById("instructionsBtn");

//update
const leaderboardBtn = document.getElementById("leaderboardBtn");

//Settings object

let settings = {
  playerName: "",
  difficulty: "Medium",
  gridSize: 4,
  theme: "Colours",
  showHints: false,
  strictMode: false,
  showPreviewTime: true,
};

// Update settings from form

function updateSettings() {
  settings.playerName = playerNameInput.value.trim();
  settings.difficulty = difficultySelect.value;
  settings.gridSize = parseInt(gridSizeSelect.value);

  settings.theme = document.querySelector("input[name='theme']:checked").value;

  settings.showHints = document.getElementById("showHints").checked;
  settings.strictMode = document.getElementById("strictMode").checked;
  settings.showPreviewTime = document.getElementById("showPreviewTime").checked;

  updatePreview();
}

// Live Preview

function updatePreview() {
  previewText.textContent = `
Player: ${settings.playerName || "Not set"}
Difficulty: ${settings.difficulty}
Grid: ${settings.gridSize}x${settings.gridSize}
Theme: ${settings.theme}
Options: ${settings.strictMode ? "Strict " : ""}${settings.showHints ? "Hints " : ""}
`;
}

// Save Settings (Cookies)

function saveSettings() {
  document.cookie = `playerName=${settings.playerName}`;
  document.cookie = `bestScore=0`; //default for now
  alert("Settings saved!");
}

//Load settings

function loadSettings() {
  const cookies = document.cookie.split(";");

  cookies.forEach((c) => {
    const [key, value] = c.trim().split("=");
    if (key === "playerName") {
      playerNameInput.value = value;
    }
  });
}

updateSettings();
console.log("Settings loaded!");

// Reset Settings

function resetSettings() {
  if (confirm("Are you sure you want to reset settings?")) {
    document.getElementById("setupForm").reset();
    updateSettings();
  }
}

// Open game Window

function openGame() {
  updateSettings();

  if (!settings.playerName) {
    settings.playerName = prompt("Enter your name:");
    if (!settings.playerName) return;
  }

  //save settings in session storage
  sessionStorage.setItem("settings", JSON.stringify(settings));

  window.location.href = "game.html";
}

//Navigation

function openInstructions() {
  window.location.href = "instructions.html";
}

// event listeners

document.querySelectorAll("input, select").forEach((el) => {
  el.addEventListener("change", updateSettings);
});

openGameBtn.addEventListener("click", openGame);
leaderboardBtn.addEventListener("click", () => {
  window.location.href = "leaderboard.html";
});
saveSettingsBtn.addEventListener("click", saveSettings);
loadSettingsBtn.addEventListener("click", loadSettings);
resetSettingsBtn.addEventListener("click", resetSettings);
instructionsBtn.addEventListener("click", openInstructions);

// Init preview
updateSettings();
