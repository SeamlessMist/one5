let characters = [];
let targetCharacter = null;
let availableNames = [];
let currentMode = 'daily';
let guessCount = 0;

// AUDIO SETUP
const SFX = {
    win: "https://cdn.pixabay.com/audio/2021/08/04/audio_062534f31c.mp3", // Replace with your Luffy .mp3
    wrong: "https://cdn.pixabay.com/audio/2022/03/15/audio_73060f089f.mp3" // Replace with your Doffy .mp3
};

// 1. Audio Unlocker Logic (Crucial for Browsers)
function unlockAudio() {
    const a1 = new Audio(SFX.win);
    const a2 = new Audio(SFX.wrong);
    a1.play().then(() => { a1.pause(); });
    a2.play().then(() => { a2.pause(); });
    document.removeEventListener('click', unlockAudio);
    console.log("Audio engine ready.");
}
document.addEventListener('click', unlockAudio);

function playSound(type) {
    const audio = new Audio(SFX[type]);
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Sound blocked. Click page first."));
}

const arcOrder = ["Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown", "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta", "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark", "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island", "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"];

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

function setMode(mode) {
    currentMode = mode;
    resetGame();
}

function resetGame() {
    guessCount = 0;
    document.getElementById('guesses-left-text').innerText = `10 / 10`;
    availableNames = characters.map(c => c.name).sort();
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('end-overlay').classList.remove('flex', 'opacity-100');
    document.getElementById('search-module').classList.remove('hidden');
    document.getElementById('game-board').innerHTML = '';
    targetCharacter = currentMode === 'daily' ? getDailyCharacter() : characters[Math.floor(Math.random() * characters.length)];
}

function getDailyCharacter() {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
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
                d.className = "search-item cursor-pointer uppercase text-xs";
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
    document.getElementById('guesses-left-text').innerText = `${(10 - guessCount).toString().padStart(2, '0')} / 10`;
    renderGuess(char);
    if (char.name === targetCharacter.name) setTimeout(() => endGame(true), 1200);
    else if (guessCount >= 10) setTimeout(() => endGame(false), 1200);
}

function renderGuess(guess) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 mb-3';
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
    board.prepend(row);
}

function createTile(label, value, type, isName = false) {
    let cls = 'border-white/10';
    let txtCls = 'text-white';
    if (type.includes('match-exact')) { cls = 'glow-yellow'; txtCls = 'text-yellow-400'; }
    else if (type.includes('match-partial')) { cls = 'glow-green'; txtCls = 'text-green-400'; }
    else if (type.includes('match-none')) { cls = 'glow-red'; txtCls = 'text-red-500'; }
    let display = value;
    if (type.includes('▲')) display += ' ▲';
    if (type.includes('▼')) display += ' ▼';
    return `<div class="modular-unit flip-in ${cls}">${!isName ? `<span class="text-[9px] uppercase mb-1 opacity-50 text-white font-label">${label}</span>` : ''}<span class="tile-value ${txtCls}">${display}</span></div>`;
}

function formatHaki(h) { return (!h || h[0] === "None") ? "NONE" : h.map(x => x.substring(0,3)).join('/').toUpperCase(); }
function compareHaki(g, t) {
    if (JSON.stringify(g) === JSON.stringify(t)) return 'match-exact';
    return g.some(x => t.includes(x)) ? 'match-partial' : 'match-none';
}
function compareStat(g, t) { 
    if (g === t) return 'match-exact';
    return 'match-none' + (g < t ? ' ▲' : ' ▼');
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
    playSound(win ? 'win' : 'wrong');
    document.getElementById('search-module').classList.add('hidden');
    const o = document.getElementById('end-overlay');
    o.classList.remove('hidden'); o.classList.add('flex');
    setTimeout(() => o.classList.add('opacity-100'), 10);
    document.getElementById('card-title').innerText = win ? "KING OF THE PIRATES" : "WALK THE PLANK";
    document.getElementById('card-title').style.color = win ? "#f7e600" : "#ef4444";
    document.getElementById('card-subtitle').innerText = win ? `You found ${targetCharacter.name}!` : `It was ${targetCharacter.name}.`;
}
