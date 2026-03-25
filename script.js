let characters = [];
let targetCharacter = null;
let currentMode = 'daily';
let guessCount = 0;

// AUDIO RE-TRIGGER (Crucial for Chrome)
function initAudio() {
    const win = document.getElementById('sound-win');
    const lose = document.getElementById('sound-lose');
    // We play and immediately pause to "authorize" the sound with the browser
    win.play().then(() => { win.pause(); win.currentTime = 0; });
    lose.play().then(() => { lose.pause(); lose.currentTime = 0; });
    document.removeEventListener('click', initAudio);
    console.log("Audio authorized");
}
document.addEventListener('click', initAudio);

window.onload = async () => {
    try {
        const res = await fetch('characters.json');
        characters = await res.json();
        setupAutocomplete();
        document.getElementById('btn-daily').onclick = () => setMode('daily');
        document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
        document.getElementById('btn-play-again').onclick = () => resetGame();
        setMode('daily');
    } catch (e) { console.error(e); }
};

function setMode(m) {
    currentMode = m;
    const indicator = document.getElementById('mode-indicator');
    if (m === 'daily') indicator.style.transform = 'translateX(0)';
    else indicator.style.transform = 'translateX(calc(100% - 2px))';
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
    return characters[Math.floor((Math.abs(Math.sin(seed) * 10000) % 1) * characters.length)];
}

function setupAutocomplete() {
    const input = document.getElementById("guess-input"), list = document.getElementById("autocomplete-list");
    input.oninput = () => {
        const val = input.value.trim().toLowerCase();
        list.innerHTML = '';
        if(!val) { list.classList.add('hidden'); return; }
        const matches = characters.filter(c => c.name.toLowerCase().includes(val));
        if(matches.length) {
            list.classList.remove('hidden');
            matches.slice(0,10).forEach(m => {
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
    const name = document.getElementById('guess-input').value.trim();
    const char = characters.find(c => c.name === name);
    if (!char) return;
    document.getElementById('guess-input').value = '';
    guessCount++;
    document.getElementById('guesses-left-text').innerText = `${10 - guessCount} / 10`;
    renderRow(char);
    if (char.name === targetCharacter.name) endGame(true);
    else if (guessCount >= 10) endGame(false);
}

function renderRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 mb-4';
    const isT = g.name === targetCharacter.name;
    
    const arcOrder = ["Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown", "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta", "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark", "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island", "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"];

    const compareStat = (g, t) => g === t ? 'match-exact' : g < t ? 'match-none ▲' : 'match-none ▼';
    const compareArc = (g, t) => g === t ? 'match-exact' : arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
    const parseB = (b) => parseInt(b.toString().replace(/[^0-9]/g, '')) || 0;
    const formatB = (b) => {
        let n = parseB(b);
        if(n>=1e9) return (n/1e9).toFixed(1)+'B';
        if(n>=1e6) return (n/1e6).toFixed(1)+'M';
        return n>0 ? n.toLocaleString() : "NONE";
    };

    const tiles = [
        createTile('NAME', g.name, isT ? 'match-exact' : 'none', true),
        createTile('SEX', g.gender, g.gender === targetCharacter.gender ? 'match-exact' : 'match-none'),
        createTile('RACE', g.species, g.species === targetCharacter.species ? 'match-exact' : 'match-none'),
        createTile('ROLE', g.calling, g.calling === targetCharacter.calling ? 'match-exact' : 'match-none'),
        createTile('GROUP', g.affiliation, g.affiliation === targetCharacter.affiliation ? 'match-exact' : 'match-none'),
        createTile('FRUIT', g.devilFruitType, g.devilFruitType === targetCharacter.devilFruitType ? 'match-exact' : 'match-none'),
        createTile('HAKI', g.haki.map(x=>x.substring(0,3)).join('/').toUpperCase(), (JSON.stringify(g.haki) === JSON.stringify(targetCharacter.haki) ? 'match-exact' : (g.haki.some(x=>targetCharacter.haki.includes(x)) ? 'match-partial' : 'match-none'))),
        createTile('HEIGHT', g.heightCm + 'cm', compareStat(g.heightCm, targetCharacter.heightCm)),
        createTile('BOUNTY', formatB(g.bounty), compareStat(parseB(g.bounty), parseB(targetCharacter.bounty))),
        createTile('ORIGIN', g.seaOfBirth, g.seaOfBirth === targetCharacter.seaOfBirth ? 'match-exact' : 'match-none'),
        createTile('DEBUT', g.firstArc, compareArc(g.firstArc, targetCharacter.firstArc))
    ];
    row.innerHTML = tiles.join('');
    board.prepend(row);
}

function createTile(l, v, type, isN) {
    let cls = type.includes('match-exact') ? 'glow-yellow' : type.includes('match-partial') ? 'glow-green' : type.includes('match-none') ? 'glow-red' : '';
    let arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="modular-unit flip-in ${cls}">${!isN ? `<span class="font-label-style">${l}</span>`:''}<span class="tile-value">${v}${arrow}</span></div>`;
}

function endGame(win) {
    const s = document.getElementById(win ? 'sound-win' : 'sound-lose');
    s.currentTime = 0; s.play();
    const o = document.getElementById('end-overlay');
    o.classList.remove('hidden'); o.classList.add('flex');
    setTimeout(() => o.classList.add('opacity-100'), 10);
    document.getElementById('card-title').innerText = win ? "KING OF THE PIRATES" : "WALK THE PLANK";
    document.getElementById('card-title').style.color = win ? "#a38900" : "#ef4444";
    document.getElementById('card-subtitle').innerText = win ? `You found ${targetCharacter.name}!` : `It was ${targetCharacter.name}.`;
}
