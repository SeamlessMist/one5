let characters = [];
let targetCharacter = null;
let availableNames = [];
let currentMode = 'daily';
let guessCount = 0;
const MAX_GUESSES = 10;

// Exact Chronological Order of One Piece Arcs
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
    document.getElementById('btn-play-again').addEventListener('click', () => resetGame());

    try {
        const response = await fetch('characters.json');
        characters = await response.json();
        setupAutocomplete();
        setMode('daily'); 
    } catch (e) { console.error("Data load error", e); }
});

function playSound(id) {
    const audio = document.getElementById(id);
    if(audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}

function setMode(mode) {
    currentMode = mode;
    const d = document.getElementById('btn-daily'), u = document.getElementById('btn-unlimited');
    if(mode === 'daily') {
        d.classList.add('text-secondary-fixed'); d.classList.remove('text-white/40');
        u.classList.add('text-white/40'); u.classList.remove('text-secondary-fixed');
    } else {
        u.classList.add('text-secondary-fixed'); u.classList.remove('text-white/40');
        d.classList.add('text-white/40'); d.classList.remove('text-secondary-fixed');
    }
    resetGame();
}

function resetGame() {
    guessCount = 0;
    updateTracker();
    availableNames = characters.map(c => c.name).sort();
    
    const o = document.getElementById('end-overlay');
    o.classList.add('hidden');
    o.classList.remove('flex', 'opacity-100');
    document.getElementById('end-modal').classList.remove('victory-active');
    
    document.getElementById('search-module').classList.remove('hidden');
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
                d.className = "px-6 py-3 cursor-pointer search-item hover:bg-black/5 transition-colors text-sm uppercase";
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
    row.className = 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 mb-4';

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
    board.prepend(row); // PREPEND puts latest at the top

    row.querySelectorAll('.flip-in').forEach((t, i) => t.style.animationDelay = (i * 0.05) + 's');
}

function createTile(label, value, type, isName = false) {
    let cls = 'border-outline-variant/20';
    let txtCls = 'text-white';

    // COLOR LOGIC: Yellow = Correct, Green = Partial, Red = Wrong
    if (type === 'match-exact') { cls = 'glow-yellow'; txtCls = 'text-yellow-400'; }
    else if (type.startsWith('match-partial')) { cls = 'glow-green'; txtCls = 'text-green-400'; }
    else if (type.startsWith('match-none')) { cls = 'glow-red'; txtCls = 'text-red-400'; }

    // If it's the wrong answer but has an arrow (e.g., match-none ▲)
    let displayValue = value;
    if (type.includes('▲')) displayValue += ' ▲';
    if (type.includes('▼')) displayValue += ' ▼';

    return `
    <div class="modular-unit glass-panel rounded-xl flip-in ${cls}">
        ${!isName ? `<span class="text-[9px] font-label uppercase mb-1 tracking-tighter opacity-40">${label}</span>` : ''}
        <span class="tile-value font-bold uppercase ${txtCls}">${displayValue}</span>
    </div>`;
}

// HELPER FUNCTIONS
function formatHaki(h) { 
    if (!h || h.length === 0 || h[0] === "None") return "NONE"; 
    return h.map(x => x.substring(0,3)).join('/').toUpperCase(); 
}

function compareHaki(g, t) {
    if (JSON.stringify(g) === JSON.stringify(t)) return 'match-exact';
    return g.some(x => t.includes(x)) ? 'match-partial' : 'match-none';
}

function compareStat(g, t) { 
    if (g === t) return 'match-exact';
    return g < t ? 'match-none ▲' : 'match-none ▼';
}

function parseBounty(b) { return parseInt(b.toString().replace(/[^0-9]/g, '')) || 0; }

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
    const o = document.getElementById('end-overlay');
    const modal = document.getElementById('end-modal');
    
    document.getElementById('search-module').classList.add('hidden');
    o.classList.remove('hidden');
    o.classList.add('flex');

    if (win) {
        playSound('sfx-win');
        modal.classList.add('victory-active');
        document.getElementById('card-title').innerText = "KING OF THE PIRATES!";
        document.getElementById('card-title').style.color = "#f7e600";
        document.getElementById('card-subtitle').innerText = `Amazing! It was indeed ${targetCharacter.name}.`;
    } else {
        playSound('sfx-wrong');
        document.getElementById('card-title').innerText = "WALK THE PLANK...";
        document.getElementById('card-title').style.color = "#ef4444";
        document.getElementById('card-subtitle').innerText = `You failed to find them. It was ${targetCharacter.name}.`;
    }

    setTimeout(() => o.classList.add('opacity-100'), 10);
}
