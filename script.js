let characters = [];
let targetCharacter = null;
let currentMode = 'daily';
let guessCount = 0;

// SOUNDS
const winSound = new Audio("https://raw.githubusercontent.com/ArshAnson/One-Piece-Dle-Assets/main/luffy-laugh.mp3");
const loseSound = new Audio("https://raw.githubusercontent.com/ArshAnson/One-Piece-Dle-Assets/main/doffy-laugh.mp3");

function unlockAudio() {
    winSound.play().then(()=>winSound.pause());
    loseSound.play().then(()=>loseSound.pause());
    document.removeEventListener('click', unlockAudio);
}
document.addEventListener('click', unlockAudio);

const arcOrder = ["Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown", "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta", "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark", "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island", "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"];

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById('btn-daily').onclick = () => setMode('daily');
    document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
    document.getElementById('btn-play-again').onclick = () => resetGame();

    const response = await fetch('characters.json');
    characters = await response.json();
    setupAutocomplete();
    setMode('daily');
});

function setMode(mode) {
    currentMode = mode;
    const indicator = document.getElementById('mode-indicator');
    const dailyBtn = document.getElementById('btn-daily');
    const unlimitedBtn = document.getElementById('btn-unlimited');

    if (mode === 'daily') {
        indicator.style.transform = 'translateX(0)';
        dailyBtn.classList.add('mode-active');
        unlimitedBtn.classList.remove('mode-active');
    } else {
        indicator.style.transform = 'translateX(100%)';
        unlimitedBtn.classList.add('mode-active');
        dailyBtn.classList.remove('mode-active');
    }
    resetGame();
}

function resetGame() {
    guessCount = 0;
    document.getElementById('guesses-left-text').innerText = `10 / 10`;
    document.getElementById('game-board').innerHTML = '';
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('search-module').classList.remove('hidden');
    targetCharacter = currentMode === 'daily' ? getDaily() : characters[Math.floor(Math.random()*characters.length)];
}

function getDaily() {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return characters[Math.floor((Math.sin(seed)*10000 % 1 + 1) % 1 * characters.length)];
}

function setupAutocomplete() {
    const input = document.getElementById("guess-input"), list = document.getElementById("autocomplete-list");
    input.oninput = () => {
        const val = input.value.toLowerCase();
        list.innerHTML = '';
        if(!val) { list.classList.add('hidden'); return; }
        const matches = characters.filter(c => c.name.toLowerCase().includes(val));
        if(matches.length) {
            list.classList.remove('hidden');
            matches.forEach(m => {
                const d = document.createElement('div');
                d.className = 'search-item cursor-pointer';
                d.innerText = m.name;
                d.onclick = () => { input.value = m.name; list.classList.add('hidden'); submitGuess(); };
                list.appendChild(d);
            });
        }
    };
}

function submitGuess() {
    const name = document.getElementById('guess-input').value;
    const char = characters.find(c => c.name === name);
    if(!char) return;
    document.getElementById('guess-input').value = '';
    guessCount++;
    document.getElementById('guesses-left-text').innerText = `${10 - guessCount} / 10`;
    renderRow(char);
    if(char.name === targetCharacter.name) endGame(true);
    else if(guessCount >= 10) endGame(false);
}

function renderRow(g) {
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 mb-4';
    const isT = g.name === targetCharacter.name;
    const t = [
        createTile('NAME', g.name, isT ? 'match-exact' : 'none', true),
        createTile('SEX', g.gender, g.gender === targetCharacter.gender ? 'match-exact' : 'match-none'),
        createTile('RACE', g.species, g.species === targetCharacter.species ? 'match-exact' : 'match-none'),
        createTile('ROLE', g.calling, g.calling === targetCharacter.calling ? 'match-exact' : 'match-none'),
        createTile('GROUP', g.affiliation, g.affiliation === targetCharacter.affiliation ? 'match-exact' : 'match-none'),
        createTile('FRUIT', g.devilFruitType, g.devilFruitType === targetCharacter.devilFruitType ? 'match-exact' : 'match-none'),
        createTile('HAKI', formatHaki(g.haki), compareHaki(g.haki, targetCharacter.haki)),
        createTile('HEIGHT', g.heightCm + 'cm', compareStat(g.heightCm, targetCharacter.heightCm)),
        createTile('BOUNTY', formatB(g.bounty), compareStat(parseB(g.bounty), parseB(targetCharacter.bounty))),
        createTile('ORIGIN', g.seaOfBirth, g.seaOfBirth === targetCharacter.seaOfBirth ? 'match-exact' : 'match-none'),
        createTile('DEBUT', g.firstArc, compareArc(g.firstArc, targetCharacter.firstArc))
    ];
    row.innerHTML = t.join('');
    document.getElementById('game-board').prepend(row);
}

function createTile(l, v, type, isN) {
    let cls = type === 'match-exact' ? 'glow-yellow' : type === 'match-partial' ? 'glow-green' : type.includes('match-none') ? 'glow-red' : '';
    let arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="modular-unit flip-in ${cls}">${!isN ? `<span class="font-label-style">${l}</span>`:''}<span class="tile-value">${v}${arrow}</span></div>`;
}

function formatHaki(h) { return h[0]==="None" ? "NONE" : h.map(x=>x.substring(0,3)).join('/').toUpperCase(); }
function compareHaki(g, t) { return JSON.stringify(g)===JSON.stringify(t) ? 'match-exact' : g.some(x=>t.includes(x)) ? 'match-partial' : 'match-none'; }
function compareStat(g, t) { return g===t ? 'match-exact' : g < t ? 'match-none ▲' : 'match-none ▼'; }
function parseB(b) { return parseInt(b.toString().replace(/[^0-9]/g, '')) || 0; }
function formatB(b) { let n = parseB(b); if(n>=1e9) return (n/1e9).toFixed(1)+'B'; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; return n>0?n.toLocaleString():"NONE"; }
function compareArc(g, t) { return g===t ? 'match-exact' : arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼'; }

function endGame(win) {
    win ? winSound.play() : loseSound.play();
    document.getElementById('end-overlay').classList.remove('hidden');
    document.getElementById('end-overlay').classList.add('flex');
    setTimeout(()=>document.getElementById('end-overlay').classList.add('opacity-100'), 10);
    document.getElementById('card-title').innerText = win ? "BOUNTY CLAIMED" : "WALK THE PLANK";
    document.getElementById('card-title').style.color = win ? "#f7e600" : "#ef4444";
    document.getElementById('card-subtitle').innerText = win ? `Identified: ${targetCharacter.name}` : `It was: ${targetCharacter.name}`;
}
