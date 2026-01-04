// =========================
// 1️⃣ SELECCIÓN DEL DOM
// =========================

// Navegación
const btnHome = document.getElementById("btn-home");
const btnUser = document.getElementById("btn-user");

// Vistas
const viewMain = document.getElementById("view-main");
const viewUser = document.getElementById("view-user");

// To-Do
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("add-task");
const taskList = document.getElementById("task-list");
const difficultySelect = document.getElementById("task-difficulty");
const filterButtons = document.querySelectorAll(".task-filters button");

// Panel del jugador
const levelText = document.querySelector(".player-top span");
const xpText = document.querySelector(".xp-text");
const xpFill = document.querySelector(".xp-fill");
const heartsContainer = document.querySelector(".hearts");
const avatar = document.getElementById("player-avatar");


// Historial
const historyContainer = document.querySelector(".history");

// Estadisticas (User View)
const statCompleted = document.getElementById("stat-completed");
const statStreak = document.getElementById("stat-streak");
const statSuccess = document.getElementById("stat-success");
const statGameOver = document.getElementById("stat-gameover");

// Resumen
const summaryXP = document.getElementById("sum-xp");
const summaryCompleted = document.getElementById("sum-completed");
const summaryFailed = document.getElementById("sum-failed");
const summaryBestStreak = document.getElementById("sum-best-streak");
const todayCompleted = document.getElementById("today-completed");
const todayFailed = document.getElementById("today-failed");
const todayXP = document.getElementById("today-xp");

// Misiones
const achFirst = document.getElementById("ach-first");
const achStreak5 = document.getElementById("ach-streak5");
const achVeteran = document.getElementById("ach-veteran");
const achDedicated = document.getElementById("ach-dedicated");
const achPerfect = document.getElementById("ach-perfect");
const achSurvivor = document.getElementById("ach-survivor");

// Tema
const toggleThemeBtn = document.getElementById("toggle-theme");

// Modal Eliminacion
const modal = document.getElementById("confirm-modal");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

let taskToDelete = null;
let taskElementToDelete = null;

// Input
taskInput.focus();

taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addTaskBtn.click();
    }
});



// =========================
// 2️⃣ CAMBIO DE VISTAS
// =========================

btnHome.addEventListener("click", () => {
    viewMain.classList.add("active");
    viewUser.classList.remove("active");
});

btnUser.addEventListener("click", () => {
    viewUser.classList.add("active");
    viewMain.classList.remove("active");
});


// =========================
// 3️⃣ DATOS (ESTADO)
// =========================

let tasks = [];

let player = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    lives: 3,
    maxLives: 3,

    completedTasks: 0,
    failedTasks: 0,
    currentStreak: 0,
    bestStreak: 0,
    gameOvers: 0,
    totalXpEarned: 0
};

let history = [];

let achievements = {
    firstMission: false,
    streak5: false,
    veteran: false,
    dedicated: false,
    perfect: false,
    survivor: false
};


const difficultyConfig = {
    easy: { xp: 10, penalty: 1 },
    medium: { xp: 20, penalty: 1 },
    hard: { xp: 40, penalty: 2 }
};

let currentFilter = "all";

let dailyStats = {};

let punishmentActive = false;
let punishmentTimer = null;
const PUNISHMENT_TIME = 10; // segundos (ajusta si quieres)


// =========================
// 4️⃣ LOCALSTORAGE
// =========================

loadTasks();
loadPlayer();
loadHistory();
loadAchievements();

function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        tasks.forEach(task => renderTask(task));
    }
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadPlayer() {
    const savedPlayer = localStorage.getItem("player");
    if (savedPlayer) {
        player = JSON.parse(savedPlayer);
    }
    updatePlayerUI();
    updateStatsUI();
    updateDailyStatsUI();
}

function savePlayer() {
    localStorage.setItem("player", JSON.stringify(player));
}

function loadHistory() {
    const savedHistory = localStorage.getItem("history");
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        renderHistory();
    }
}

function saveHistory() {
    localStorage.setItem("history", JSON.stringify(history));
}

function loadAchievements() {
    const saved = localStorage.getItem("achievements");
    if (saved) {
        achievements = JSON.parse(saved);
    }
    updateAchievementsUI();
}

function saveAchievements() {
    localStorage.setItem("achievements", JSON.stringify(achievements));
}


// =========================
// 5️⃣ AÑADIR TAREA
// =========================

addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();

    if (text === "") {
        taskInput.classList.add("input-error");
        setTimeout(() => taskInput.classList.remove("input-error"), 300);
        return;
    }

    const difficulty = difficultySelect.value;

    const task = {
        text,
        difficulty,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTask(task);

    taskInput.value = "";
});


// =========================
// 6️⃣ RENDER TAREA Y HISTORIAL
// =========================

function renderTask(task) {
    const li = document.createElement("li");

    if (task.completed) {
        li.classList.add("completed");
    }

    li.innerHTML = `
    <span>${task.text}</span>
    <span class="tag ${task.difficulty}">
        ${task.difficulty.toUpperCase()}
    </span>

    <div class="task-actions">
        <button class="btn complete">✅</button>
        <button class="btn delete">❌</button>
    </div>`;

    // Completar misión → gana XP
    li.querySelector(".complete").addEventListener("click", () => {
        if (!task.completed) {
            task.completed = true;
            li.classList.add("completed");
            player.completedTasks++;
            player.currentStreak++;
            player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
            const reward = difficultyConfig[task.difficulty].xp;
            const todayStats = getTodayStats();
            todayStats.completed++;
            todayStats.xp += reward;
            saveDailyStats();
            gainXP(reward);
            applyFilter();
            addHistoryEvent(task.text, "success", `+${reward} XP`);
            checkAchievements();
            saveTasks();
        }
    });

    // Eliminar misión
    li.querySelector(".delete").addEventListener("click", () => {
        taskToDelete = task;
        taskElementToDelete = li;
        modal.classList.remove("hidden");
    });




    taskList.appendChild(li);
}

function renderHistory() {
    historyContainer.innerHTML = "<h3>🕒 Historial Reciente</h3>";

    history.forEach(item => {
        const div = document.createElement("div");
        div.className = `history-item ${item.type}`;

        div.innerHTML = `
      <span>${item.type === "success" ? "✅" : "❌"} ${item.text}</span>
      <small>${item.time}</small>
      <strong>${item.xpChange}</strong>
    `;

        historyContainer.appendChild(div);
    });
}


// =========================
// 7️⃣ XP Y NIVELES Y VIDAS
// =========================

function gainXP(amount) {
    player.xp += amount;
    player.totalXpEarned += amount;

    if (player.xp >= player.xpToNext) {
        player.xp -= player.xpToNext;
        player.level++;
        player.xpToNext += 50;

        showToast(`🎉 ¡Nivel ${player.level} desbloqueado!`);
    }

    savePlayer();
    updatePlayerUI();
    updateStatsUI();
}


function updatePlayerUI() {
    // Nivel y XP
    levelText.textContent = `Nivel ${player.level}`;
    xpText.textContent = `${player.xp} / ${player.xpToNext} XP`;

    const percent = (player.xp / player.xpToNext) * 100;
    xpFill.style.width = `${percent}%`;

    // Vidas
    let hearts = "";
    for (let i = 0; i < player.maxLives; i++) {
        hearts += i < player.lives ? "❤️ " : "♡ ";
    }
    heartsContainer.textContent = hearts.trim();

    updateAvatar();
}

function loseLife() {
    player.lives--;
    showToast("💔 Has perdido una vida");

    if (player.lives <= 0) {
        gameOver();
    }

    savePlayer();
    updatePlayerUI();
}

function gameOver() {
    showToast("💀 GAME OVER · Progreso reiniciado");

    player.failedTasks++;
    player.gameOvers++;

    player.lives = player.maxLives;
    player.xp = 0;
    player.level = 1;
    player.xpToNext = 100;
    player.currentStreak = 0;

    const todayStats = getTodayStats();
    todayStats.failed++;
    saveDailyStats();

    savePlayer();
    updatePlayerUI();
    updateStatsUI();
    activatePunishment();
}


// =========================
// 🎱 HISTORIAL DE JUFGADOR
// =========================

function addHistoryEvent(text, type, xpChange) {
    const now = new Date();
    const time = now.toLocaleDateString() + " · " + now.toLocaleTimeString().slice(0, 5);

    history.unshift({
        text,
        type,        // "success" | "fail"
        time,
        xpChange
    });

    // limitar historial a 5
    history = history.slice(0, 5);

    saveHistory();
    renderHistory();
}

function updateStatsUI() {
    const total = player.completedTasks + player.failedTasks;
    const successRate = total === 0 ? 0 : Math.round((player.completedTasks / total) * 100);

    // Cards
    statCompleted.textContent = player.completedTasks;
    statStreak.textContent = player.currentStreak;
    statSuccess.textContent = successRate + "%";
    statGameOver.textContent = player.gameOvers;

    // Summary
    summaryXP.textContent = player.totalXpEarned;
    summaryCompleted.textContent = player.completedTasks;
    summaryFailed.textContent = player.failedTasks;
    summaryBestStreak.textContent = player.bestStreak;
    updateDailyStatsUI();
}

function updateAchievementsUI() {
    toggleAchievement(achFirst, achievements.firstMission);
    toggleAchievement(achStreak5, achievements.streak5);
    toggleAchievement(achVeteran, achievements.veteran);
    toggleAchievement(achDedicated, achievements.dedicated);

    toggleSecretAchievement(achPerfect, achievements.perfect);
    toggleSecretAchievement(achSurvivor, achievements.survivor);
}

function toggleSecretAchievement(element, unlocked) {
    if (unlocked) {
        element.classList.remove("hidden");
        element.classList.remove("locked");
        element.classList.add("unlocked");
    }
}

function toggleAchievement(element, unlocked) {
    if (unlocked) {
        element.classList.remove("locked");
        element.classList.add("unlocked");
    }
}

function checkAchievements() {
    // Primera misión completada
    if (!achievements.firstMission && player.completedTasks >= 1) {
        achievements.firstMission = true;
        showToast("🏅 Logro desbloqueado: Primera misión");
    }

    // Racha de 5
    if (!achievements.streak5 && player.currentStreak >= 5) {
        achievements.streak5 = true;
        showToast("🏅 Logro desbloqueado: Racha de 5");
    }

    // Veterano: 10 misiones completadas
    if (!achievements.veteran && player.completedTasks >= 10) {
        achievements.veteran = true;
        showToast("🏅 Logro desbloqueado: Veterano");
    }

    // Guerrero dedicado: 100 XP total
    if (!achievements.dedicated && player.totalXpEarned >= 100) {
        achievements.dedicated = true;
        showToast("🏅 Logro desbloqueado: Guerrero dedicado");
    }

    // Logro secreto: 3 seguidas sin fallar
    if (!achievements.perfect && player.currentStreak >= 3) {
        achievements.perfect = true;
        showToast("💎 Logro secreto desbloqueado: Perfeccionista");
    }

    // Logro secreto: sobrevivir a 1 vida
    if (!achievements.survivor && player.lives === 1) {
        achievements.survivor = true;
        showToast("🧠 Logro secreto desbloqueado: Superviviente");
    }

    saveAchievements();
    updateAchievementsUI();
}

// ALERTS

const toast = document.getElementById("toast");

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 2500);
}

// TEMA VISUAL

loadTheme();

toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");
    toggleThemeBtn.textContent = isLight ? "☀️" : "🌙";

    localStorage.setItem("theme", isLight ? "light" : "dark");
});

function loadTheme() {
    const theme = localStorage.getItem("theme");

    if (theme === "light") {
        document.body.classList.add("light");
        toggleThemeBtn.textContent = "☀️";
    } else {
        toggleThemeBtn.textContent = "🌙";
    }
}

// CONFIRMACION ELIMINACION
confirmNo.addEventListener("click", () => {
    modal.classList.add("hidden");
    taskToDelete = null;
    taskElementToDelete = null;
});

confirmYes.addEventListener("click", () => {
    if (!taskToDelete) return;

    tasks = tasks.filter(t => t !== taskToDelete);
    taskElementToDelete.remove();

    if (!taskToDelete.completed) {
        const penalty = difficultyConfig[taskToDelete.difficulty].penalty;

        player.failedTasks++;
        player.currentStreak = 0;
        const todayStats = getTodayStats();
        todayStats.failed++;
        saveDailyStats();

        for (let i = 0; i < penalty; i++) {
            loseLife();
        }

        addHistoryEvent(
            taskToDelete.text,
            "fail",
            `-${penalty} ❤️`
        );
    }

    saveTasks();
    savePlayer();
    updateStatsUI();

    taskToDelete = null;
    taskElementToDelete = null;
    modal.classList.add("hidden");
});

// LOGICA DE FILTER
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(b => b.classList.remove("active"));
        button.classList.add("active");

        applyFilter();
    });
});

function applyFilter() {
    const items = taskList.querySelectorAll("li");

    items.forEach(li => {
        const isCompleted = li.classList.contains("completed");

        if (currentFilter === "all") {
            li.style.display = "flex";
        } else if (currentFilter === "pending") {
            li.style.display = isCompleted ? "none" : "flex";
        } else if (currentFilter === "completed") {
            li.style.display = isCompleted ? "flex" : "none";
        }
    });
}

//AVATAR FUNCIONALIDAD
function updateAvatar() {
    let icon = "🧑";

    if (player.level >= 7) {
        icon = "🐉";
    } else if (player.level >= 5) {
        icon = "🧙‍♂️";
    } else if (player.level >= 3) {
        icon = "🧙";
    }

    avatar.textContent = icon;

    avatar.classList.add("level-up");
    setTimeout(() => avatar.classList.remove("level-up"), 300);
}

//ESTADISTICAS DIARIAS
function getToday() {
    return new Date().toISOString().split("T")[0];
}

loadDailyStats();

function loadDailyStats() {
    const saved = localStorage.getItem("dailyStats");
    if (saved) {
        dailyStats = JSON.parse(saved);
    }
}

function saveDailyStats() {
    localStorage.setItem("dailyStats", JSON.stringify(dailyStats));
}

function getTodayStats() {
    const today = getToday();

    if (!dailyStats[today]) {
        dailyStats[today] = {
            completed: 0,
            failed: 0,
            xp: 0
        };
    }

    return dailyStats[today];
}

function updateDailyStatsUI() {
    const todayStats = getTodayStats();

    todayCompleted.textContent = todayStats.completed;
    todayFailed.textContent = todayStats.failed;
    todayXP.textContent = todayStats.xp;
}

//CASTIGO FUNCIONALIDAD
function activatePunishment() {
    punishmentActive = true;

    taskInput.disabled = true;
    addTaskBtn.disabled = true;

    let timeLeft = PUNISHMENT_TIME;
    showToast(`😈 Castigo activado (${timeLeft}s)`);

    punishmentTimer = setInterval(() => {
        timeLeft--;

        showToast(`😈 Castigo activado (${timeLeft}s)`);

        if (timeLeft <= 0) {
            clearInterval(punishmentTimer);
            punishmentTimer = null;
            punishmentActive = false;

            taskInput.disabled = false;
            addTaskBtn.disabled = false;

            showToast("🔓 Castigo terminado. Vuelve al combate.");
        }
    }, 1000);
}
