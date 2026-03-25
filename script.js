let characters = [];
let targetCharacter = null;
let availableNames =[];
let currentMode = 'daily';
let guessCount = 0;
const MAX_GUESSES = 10;

// Exact Chronological Order of One Piece Arcs
const arcOrder =[
    "Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown",
    "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta",
    "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark",
    "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island",
    "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"
];

document.addEventListener("DOMContentLoaded", async () => {
    // Bind UI Buttons
    document.getElementById('btn-daily').addEventListener('click', () => setMode('daily'));
    document.getElementById('btn-unlimited').addEventListener('click', () => setMode('unlimited'));
    document.getElementById('btn-play-again').addEventListener('click', resetGame);

    try {
        const response = await fetch('characters.json');
        if (!response.ok) throw new Error("Fetch failed");
        characters = await response.json();
        if (characters.length === 0) throw new Error("Empty JSON");

        setupAutocomplete();
        setMode('daily'); 
    } catch (error) {
        console.error(error);
        alert("Error loading characters.json. Please ensure the file exists.");
    }
});

function playSound(id) {
    const audio = document.getElementById(id);
    if(audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}

function setMode(mode) {
    if (characters.length === 0) return; 
    currentMode = mode;

    const btnDaily = document.getElementById('btn-daily');
    const btnUnlimited = document.getElementById('btn-unlimited');

    // Toggle Styles between Active and Inactive pills
    if (mode === 'daily') {
        btnDaily.classList.replace('text-outline/60', 'text-primary-container');
        btnDaily.querySelector('span:first-child').classList.add('drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]');
        btnDaily.querySelector('span:last-child').classList.replace('text-outline/60', 'text-primary-container');
        
        btnUnlimited.classList.replace('text-primary-container', 'text-outline/60');
        btnUnlimited.querySelector('span:first-child').classList.remove('drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]');
        btnUnlimited.querySelector('span:last-child').classList.replace('text-primary-container', 'text-outline/60');
    } else {
        btnUnlimited.classList.replace('text-outline/60', 'text-primary-container');
        btnUnlimited.querySelector('span:first-child').classList.add('drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]');
        btnUnlimited.querySelector('span:last-child').classList.replace('text-outline/60', 'text-primary-container');
        
        btnDaily.classList.replace('text-primary-container', 'text-outline/60');
        btnDaily.querySelector('span:first-child').classList.remove('drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]');
        btnDaily.querySelector('span:last-child').classList.replace('text-primary-container', 'text-outline/60');
    }
    
    resetGame();
}

function resetGame() {
    if (characters.length === 0) return;
    guessCount = 0;
    updateTracker();
    availableNames = characters.map(c => c.name).sort();
    
    // Hide Post-game Modal cleanly
    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');
    setTimeout(() => {
        overlay.classList.remove('flex');
        overlay.classList.add('hidden');
    }, 500);
    
    // Reset Board and Search UI
    document.getElementById('search-module').style.display = 'block';
    document.getElementById('guess-input').value = '';
    document.getElementById('game-board').innerHTML = '';

    targetCharacter = currentMode === 'daily' ? getDailyCharacter() : characters[Math.floor(Math.random() * characters.length)];
}

function getDailyCharacter() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const x = Math.sin(seed) * 10000;
    return characters[Math.floor((x - Math.floor(x)) * characters.length)];
}

function setupAutocomplete() {
    const input = document.getElementById("guess-input");
    const list = document.getElementById("autocomplete-list");

    input.addEventListener("input", function() {
        const val = this.value.trim();
        list.innerHTML = '';
        
        if (val.length === 0) { list.classList.add("hidden"); return; }

        const matches = availableNames.filter(name => name.toLowerCase().includes(val.toLowerCase()));
        
        if (matches.length > 0) {
            list.classList.remove("hidden");
            matches.forEach(match => {
                const div = document.createElement("div");
                div.className = "px-6 py-4 cursor-pointer border-b border-outline-variant/20 hover:bg-primary-container/10 transition-colors font-headline text-sm tracking-[0.2em] uppercase text-on-surface";
                
                const safeVal = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${safeVal})`, "gi");
                div.innerHTML = match.replace(regex, "<span class='text-primary-container drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]'>$1</span>");
                
                div.addEventListener("click", () => {
                    input.value = match;
                    list.classList.add("hidden");
                    submitGuess();
                });
                list.appendChild(div);
            });
        } else {
            list.classList.add("hidden");
        }
    });

    input.addEventListener('keypress', e => { if (e.key === 'Enter') submitGuess(); });
    document.addEventListener("click", e => { if (e.target !== input && e.target !== list) list.classList.add("hidden"); });
}

function updateTracker() {
    const left = MAX_GUESSES - guessCount;
    document.getElementById('guesses-left-text').innerText = `${left.toString().padStart(2, '0')} / ${MAX_GUESSES}`;
}

function submitGuess() {
    if (guessCount >= MAX_GUESSES || !targetCharacter) return;

    const inputEl = document.getElementById('guess-input');
    const guessName = inputEl.value.trim();

    if (!availableNames.includes(guessName)) {
        alert("Please select a valid remaining character from the list.");
        return;
    }

    const guessChar = characters.find(c => c.name === guessName);
    availableNames = availableNames.filter(name => name !== guessName);
    inputEl.value = '';
    document.getElementById("autocomplete-list").classList.add("hidden");

    guessCount++;
    updateTracker();
    renderGuess(guessChar);

    if (guessChar.name === targetCharacter.name) {
        playSound('sfx-win');
        setTimeout(() => endGame(true), 1500); 
    } else {
        playSound('sfx-wrong'); 
        if (guessCount >= MAX_GUESSES) setTimeout(() => endGame(false), 1500);
    }
}

// FORMATTING & UI LOGIC
function getShortName(name) {
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0].length <= 8) return parts[0] + "<br/>" + parts.slice(1).join(' ');
    return name;
}

function formatBountyStr(val) {
    if (!val || val === "None") return "NONE";
    if (val === "Unknown") return "UNKNOWN";
    const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num === 0) return "0";
    if (num >= 1000000000) return parseFloat((num / 1000000000).toFixed(2)) + "B";
    if (num >= 1000000) return parseFloat((num / 1000000).toFixed(2)) + "M";
    return num.toLocaleString();
}

function parseBountyNum(val) {
    if (!val || val === "None") return 0;
    if (val === "Unknown") return -1;
    const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

function getArrow(g, t) {
    if (g === t || g === -1 || t === -1) return "";
    return g < t ? "▲" : "▼";
}

function getArcArrow(gArc, tArc) {
    const gIdx = arcOrder.indexOf(gArc);
    const tIdx = arcOrder.indexOf(tArc);
    if (gIdx === -1 || tIdx === -1 || gIdx === tIdx) return "";
    return gIdx < tIdx ? "▲" : "▼"; 
}

function compareArrays(guessArr, targetArr) {
    if (!guessArr || !targetArr) return 'match-none';
    if (guessArr.length === targetArr.length && guessArr.every(v => targetArr.includes(v))) return 'match-exact';
    if (guessArr.some(v => targetArr.includes(v) && v !== "None")) return 'match-partial';
    return 'match-none';
}

function formatHaki(hakiArray) {
    if (!hakiArray || hakiArray.length === 0 || hakiArray.includes("None")) return "NONE";
    const map = { "Armament": "ARM", "Observation": "OBS", "Conqueror's": "CON", "Conqueror": "CON" };
    return hakiArray.map(h => map[h] || h.toUpperCase()).join('/');
}

// Builds the HTML for an individual trait tile 
function createTileHTML(label, value, matchType, isName = false, arrow = "") {
    let borderClass = '';
    let labelClass = '';
    let valueClass = '';

    if (matchType === 'match-exact') {
        borderClass = 'border-primary-container/30 glow-cyan';
        labelClass = 'text-primary-container/60';
        valueClass = 'text-primary-container drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]';
    } else if (matchType === 'match-partial') {
        borderClass = 'border-secondary-container/30 glow-yellow';
        labelClass = 'text-secondary-fixed/40';
        valueClass = 'text-secondary-fixed drop-shadow-[0_0_5px_rgba(247,230,0,0.3)]';
    } else if (matchType === 'match-none') {
        borderClass = 'border-error-container/40 glow-red';
        labelClass = 'text-error/40';
        valueClass = 'text-error drop-shadow-[0_0_5px_rgba(255,180,171,0.3)]';
    } else {
        borderClass = 'border-outline-variant/20 neomorphic-flat';
        valueClass = 'text-on-surface';
    }

    let arrowHTML = '';
    if (arrow === '▲') arrowHTML = `<span class="material-symbols-outlined text-[12px] ${valueClass} font-bold">arrow_upward</span>`;
    if (arrow === '▼') arrowHTML = `<span class="material-symbols-outlined text-[12px] ${valueClass} font-bold">arrow_downward</span>`;

    if (isName) {
        return `
        <div class="modular-unit glass-panel ${borderClass} rounded-xl p-3 flex flex-col items-center justify-center min-h-[100px] flip-in">
            <span class="font-headline font-bold text-[11px] text-center uppercase tracking-widest ${valueClass}">${value}</span>
        </div>`;
    }

    return `
    <div class="modular-unit glass-panel rounded-xl p-3 flex flex-col items-center justify-center border ${borderClass} min-h-[100px] flip-in">
        <span class="text-[9px] font-label ${labelClass} uppercase mb-2 tracking-tighter">${label}</span>
        <div class="flex items-center gap-1">
            <span class="font-headline text-xs font-bold ${valueClass} uppercase text-center leading-none">${value}</span>
            ${arrowHTML}
        </div>
    </div>`;
}

// Add the 11 columns to the UI
function renderGuess(guess) {
    const board = document.getElementById('game-board');
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3';

    const isTarget = guess.name === targetCharacter.name;

    const htmlParts =[
        createTileHTML('', getShortName(guess.name), isTarget ? 'match-exact' : 'neutral', true),
        createTileHTML('Sex', guess.gender, guess.gender === targetCharacter.gender ? 'match-exact' : 'match-none'),
        createTileHTML('Race', guess.species, guess.species === targetCharacter.species ? 'match-exact' : 'match-none'),
        createTileHTML('Role', guess.calling, guess.calling === targetCharacter.calling ? 'match-exact' : 'match-none'),
        createTileHTML('Group', guess.affiliation, guess.affiliation === targetCharacter.affiliation ? 'match-exact' : 'match-none'),
        createTileHTML('Fruit', guess.devilFruitType, guess.devilFruitType === targetCharacter.devilFruitType ? 'match-exact' : 'match-none'),
        createTileHTML('Haki', formatHaki(guess.haki), compareArrays(guess.haki, targetCharacter.haki)),
        createTileHTML('Height', `${guess.heightCm}CM`, guess.heightCm === targetCharacter.heightCm ? 'match-exact' : 'match-none', false, getArrow(guess.heightCm, targetCharacter.heightCm)),
        createTileHTML('Bounty', formatBountyStr(guess.bounty), guess.bounty === targetCharacter.bounty ? 'match-exact' : 'match-none', false, getArrow(parseBountyNum(guess.bounty), parseBountyNum(targetCharacter.bounty))),
        createTileHTML('Origin', guess.seaOfBirth, guess.seaOfBirth === targetCharacter.seaOfBirth ? 'match-exact' : 'match-none'),
        createTileHTML('Debut', guess.firstArc, guess.firstArc === targetCharacter.firstArc ? 'match-exact' : 'match-none', false, getArcArrow(guess.firstArc, targetCharacter.firstArc))
    ];

    rowWrapper.innerHTML = htmlParts.join('');

    // Append visually downwards to match reference grid
    board.appendChild(rowWrapper);
    
    // Apply staggered CSS animation delays
    rowWrapper.querySelectorAll('.flip-in').forEach((tile, idx) => tile.style.animationDelay = `${idx * 0.1}s`);
}

function endGame(isWin) {
    document.getElementById('search-module').style.display = 'none';
    const overlay = document.getElementById('end-overlay');
    const modal = document.getElementById('end-modal');
    const title = document.getElementById('card-title');
    const sub = document.getElementById('card-subtitle');
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        modal.classList.remove('scale-95');
        modal.classList.add('scale-100');
    }, 10);

    if(isWin) {
        title.innerText = "VICTORY";
        title.className = "font-headline text-4xl font-bold mb-3 tracking-widest uppercase text-primary-container drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]";
        sub.innerText = `You found ${targetCharacter.name} in ${guessCount} guesses.`;
    } else {
        title.innerText = "DEFEAT";
        title.className = "font-headline text-4xl font-bold mb-3 tracking-widest uppercase text-error drop-shadow-[0_0_15px_rgba(255,180,171,0.4)]";
        sub.innerText = `The character was ${targetCharacter.name}.`;
    }
}
