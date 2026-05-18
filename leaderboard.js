const leaderboardArea = document.getElementById("leaderboardArea");
console.log(localStorage.getItem("leaderboard"));
const backBtn = document.getElementById("backBtn");

//Load leaderboard
function loadLeaderboard() {
    const scores =
    JSON.parse(localStorage.getItem("leaderboard")) || [];

    //No scores yet
    if (scores.length === 0) {
        leaderboardArea.innerHTML = "<p>No scores yet.</p>";
        return;
    }

    //Sort highest first
    scores.sort((a, b) => b.score - a.score);

    //Show top 5
    leaderboardArea.innerHTML = scores
    .slice(0, 5)
    .map((player, index) => {
        return `
        <div class="stat-box" style="margin-bottom: 10px;">
        <strong>#${index + 1} - ${player.name}</strong><br>
        <span>Score: ${player.score}</span><br>
        <span>Round: ${player.round}</span><br>
        <span>Difficulty: ${player.difficulty}</span><br>
        <span>Grid: ${player.gridSize}x${player.gridSize}</span><br>
        <small>${player.date}</small>
        </div>
        `;
    })
    .join("");   
}

//back button
backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});

loadLeaderboard();