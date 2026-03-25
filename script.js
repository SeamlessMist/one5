let characters = [];
let targetCharacter = null;
let availableNames = [];
let currentMode = 'daily';
let guessCount = 0;
const MAX_GUESSES = 10;

const arcOrder = [
    "Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown",
    "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta",
    "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark",
    "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island",
    "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"
];

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById('btn-daily').addEventListener('click', () => setMode('daily'));
    document.getElementById('btn-unlimited').addEventListener('click', () => setMode('unlimited'));
    document.getElementById('btn-play-again').addEventListener('click', resetGame);

    try {
        const response = await fetch('characters.json');
        characters = await response.json();
        setupAutocomplete();
        setMode('daily'); 
    } catch (e) { console.error("Data load error", e); }
});

function setMode(mode) {
    currentMode = mode;
    const d = document.getElementById('btn-daily'), u = document.getElementById('btn-unlimited');
    if(mode === 'daily') {
        d.classList.add('text-primary-container'); d.classList.remove('text-outline/60');
        u.classList.add('text-outline/60'); u.classList.remove('text-primary-container');
    } else {
        u.classList.add('text-primary-container'); u.classList.remove('text-outline/60');
        d.classList.add('text-outline/60'); d.classList.remove('text-primary-container');
    }
    resetGame();
}

function resetGame() {
    guessCount = 0;
    updateTracker();
    availableNames = characters.map(c => c.name).sort();
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('search-module').classList.remove('hidden');
    document.getElementById('guess-input').value = '';
    document.getElementById('game-board').innerHTML = '';
    targetCharacter = currentMode === 'daily' ? getDailyCharacter() : characters[Math.floor(Math.random() * characters.length)];
}

function getDailyCharacter() {
    const seed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();
    const x = Math.sin(seed) * 10000;
    return characters[Math.floor((x - Math.floor(x)) * characters.length)];
}

function setupAutocomplete() {
    const input = document.getElementById("guess-input"), list = document.getElementById("autocomplete-list");
    input.addEventListener("input", () => {
        const val = input.value.trim().toLowerCase();
        list.innerHTML = '';
        if (!val) { list.classList.add("hidden"); return; }
        const matches = availableNames.filter(n => n.toLowerCase().includes(val));
        if (matches.length) {
            list.classList.remove("hidden");
            matches.forEach(m => {
                const d = document.createElement("div");
                d.className = "px-6 py-3 cursor-pointer border-b border-outline-variant/10 hover:bg-primary-container/10 text-xs uppercase";
                d.innerText = m;
                d.onclick = () => { input.value = m; list.classList.add("hidden"); submitGuess(); };
                list.appendChild(d);
            });
        } else list.classList.add("hidden");
    });
}

function submitGuess() {
    const input = document.getElementById('guess-input');
    const name = input.value.trim();
    if (!availableNames.includes(name)) return;
    const char = characters.find(c => c.name === name);
    availableNames = availableNames.filter(n => n !== name);
    input.value = '';
    guessCount++;
    updateTracker();
    renderGuess(char);
    if (char.name === targetCharacter.name) setTimeout(() => endGame(true), 1000);
    else if (guessCount >= MAX_GUESSES) setTimeout(() => endGame(false), 1000);
}

function updateTracker() {
    document.getElementById('guesses-left-text').innerText = `${(MAX_GUESSES - guessCount).toString().padStart(2, '0')} / ${MAX_GUESSES}`;
}

function renderGuess(guess) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 mb-4';

    const tiles = [
        createTile('NAME', guess.name, guess.name === targetCharacter.name ? 'match-exact' : 'none', true),
        createTile('SEX', guess.gender, guess.gender === targetCharacter.gender ? 'match-exact' : 'match-none'),
        createTile('RACE', guess.species, guess.species === targetCharacter.species ? 'match-exact' : 'match-none'),
        createTile('ROLE', guess.calling, guess.calling === targetCharacter.calling ? 'match-exact' : 'match-none'),
        createTile('GROUP', guess.affiliation, guess.affiliation === targetCharacter.affiliation ? 'match-exact' : 'match-none'),
        createTile('FRUIT', guess.devilFruitType, guess.devilFruitType === targetCharacter.devilFruitType ? 'match-exact' : 'match-none'),
        createTile('HAKI', formatHaki(guess.haki), compareHaki(guess.haki, targetCharacter.haki)),
        createTile('HEIGHT', guess.heightCm + 'cm', compareStat(guess.heightCm, targetCharacter.heightCm)),
        createTile('BOUNTY', formatBounty(guess.bounty), compareStat(parseBounty(guess.bounty), parseBounty(targetCharacter.bounty))),
        createTile('ORIGIN', guess.seaOfBirth, guess.seaOfBirth === targetCharacter.seaOfBirth ? 'match-exact' : 'match-none'),
        createTile('DEBUT', guess.firstArc, compareArc(guess.firstArc, targetCharacter.firstArc))
    ];

    row.innerHTML = tiles.join('');
    
    // THE FIX: PREPEND puts the newest guess at the top
    board.prepend(row);

    row.querySelectorAll('.flip-in').forEach((t, i) => t.style.animationDelay = (i * 0.05) + 's');
}

function createTile(label, value, type, isName = false) {
    let cls = 'border-outline-variant/20';
    let txtCls = 'text-on-surface';
    let lblCls = 'text-outline/40';

    if (type === 'match-exact') { cls = 'glow-cyan'; txtCls = 'text-primary-container'; lblCls = 'text-primary-container/40'; }
    else if (type === 'match-partial') { cls = 'glow-yellow'; txtCls = 'text-secondary-fixed'; lblCls = 'text-secondary-fixed/40'; }
    else if (type === 'match-none') { cls = 'glow-red'; txtCls = 'text-error'; lblCls = 'text-error/40'; }

    return `
    <div class="modular-unit glass-panel rounded-xl flip-in ${cls}">
        ${!isName ? `<span class="text-[8px] font-label uppercase mb-1 tracking-tighter ${lblCls}">${label}</span>` : ''}
        <span class="tile-value font-bold uppercase ${txtCls} ${isName ? 'name-text' : ''}">${value}</span>
    </div>`;
}

// Helpers
function formatHaki(h) { return (!h || h[0] === "None") ? "NONE" : h.map(x => x.substring(0,3)).join('/').toUpperCase(); }
function compareHaki(g, t) {
    if (JSON.stringify(g) === JSON.stringify(t)) return 'match-exact';
    return g.some(x => t.includes(x)) ? 'match-partial' : 'match-none';
}
function compareStat(g, t) { 
    if (g === t) return 'match-exact';
    return 'match-none' + (g < t ? ' ▲' : ' ▼'); // Note: Arrows are handled as text here for simplicity
}
function parseBounty(b) { return parseInt(b.replace(/[^0-9]/g, '')) || 0; }
function formatBounty(b) {
    let n = parseBounty(b);
    if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    return n > 0 ? n.toLocaleString() : "NONE";
}
function compareArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

function endGame(win) {
    document.getElementById('search-module').classList.add('hidden');
    const o = document.getElementById('end-overlay');
    o.classList.remove('hidden');
    document.getElementById('card-title').innerText = win ? "BOUNTY CLAIMED" : "LOST AT SEA";
    document.getElementById('card-subtitle').innerText = win ? `You identified ${targetCharacter.name}!` : `It was ${targetCharacter.name}.`;
}
