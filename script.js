let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames = [];

const winSound = new Audio('luffy.mp3');
const loseSound = new Audio('doffy.mp3');
let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;
    winSound.play().then(() => { winSound.pause(); winSound.currentTime = 0; }).catch(() => {});
    loseSound.play().then(() => { loseSound.pause(); loseSound.currentTime = 0; }).catch(() => {});
    audioUnlocked = true;
    document.removeEventListener('pointerdown', unlockAudio);
}
document.addEventListener('pointerdown', unlockAudio);

const arcOrder = ["Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown", "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta", "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark", "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island", "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"];

// Use DOMContentLoaded to ensure elements exist before script runs
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Try fetching characters.json
        const res = await fetch('./characters.json');
        if (!res.ok) throw new Error("File not found: characters.json. CHECK THE FILENAME!");
        characters = await res.json();
        
        initUI();
        setMode('daily');
    } catch (e) {
        console.error(e);
        alert(e.message + "\n\nNote: If opening locally, use Live Server.");
    }
});

function initUI() {
    document.getElementById('btn-daily').onclick = () => setMode('daily');
    document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
    document.getElementById('btn-play-again').onclick = () => resetGame();
    setupSearch();
}

function setMode(newMode) {
    mode = newMode;
    const pill = document.getElementById('mode-pill');
    const dBtn = document.getElementById('btn-daily');
    const uBtn = document.getElementById('btn-unlimited');
    if (mode === 'daily') {
        pill.style.transform = 'translateX(0)';
        dBtn.classList.add('mode-active');
        uBtn.classList.remove('mode-active');
        uBtn.classList.add('opacity-40');
    } else {
        pill.style.transform = 'translateX(100%)';
        uBtn.classList.add('mode-active');
        uBtn.classList.remove('opacity-40');
        dBtn.classList.remove('mode-active');
        dBtn.classList.add('opacity-40');
    }
    resetGame();
}

function resetGame() {
    guesses = 0;
    document.getElementById('guesses-left-text').innerText = `${MAX_GUESSES} / ${MAX_GUESSES}`;
    const board = document.getElementById('game-board');
    const header = board.querySelector('.category-row');
    board.innerHTML = '';
    board.appendChild(header);
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('guess-input').disabled = false;
    document.getElementById('guess-input').value = '';
    filteredNames = characters.map(c => c.name);
    
    if (mode === 'daily') {
        const d = new Date();
        const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        targetChar = characters[Math.floor((Math.abs(Math.sin(seed) * 10000) % 1) * characters.length)];
    } else {
        targetChar = characters[Math.floor(Math.random() * characters.length)];
    }
}

function setupSearch() {
    const input = document.getElementById('guess-input');
    const dropdown = document.getElementById('autocomplete-list');
    
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        if (!val) { dropdown.classList.add('hidden'); return; }
        const matches = characters.filter(c => c.name.toLowerCase().includes(val) && filteredNames.includes(c.name));
        if (matches.length > 0) {
            dropdown.classList.remove('hidden');
            matches.slice(0, 8).forEach(char => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `<img src="${char.image}"> <span>${char.name}</span>`;
                div.onclick = () => {
                    input.value = char.name;
                    dropdown.classList.add('hidden');
                    executeGuess();
                };
                dropdown.appendChild(div);
            });
        } else { dropdown.classList.add('hidden'); }
    });
}

function executeGuess() {
    const input = document.getElementById('guess-input');
    const name = input.value.trim();
    const char = characters.find(c => c.name === name);
    if (!char || !filteredNames.includes(name)) return;
    input.value = '';
    filteredNames = filteredNames.filter(n => n !== name);
    guesses++;
    document.getElementById('guesses-left-text').innerText = `${MAX_GUESSES - guesses} / 10`;
    renderRow(char);
    if (char.name === targetChar.name) setTimeout(() => triggerEnd(true), 1200);
    else if (guesses >= MAX_GUESSES) setTimeout(() => triggerEnd(false), 1200);
}

function renderRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 px-2 mb-2';
    const isT = g.name === targetChar.name;
    const getArrow = (gu, ta) => gu === ta ? '' : (gu < ta ? ' ▲' : ' ▼');
    const parseB = (b) => parseInt(b.toString().replace(/[^0-9]/g, '')) || 0;
    
    const formatB = (b) => {
        let n = parseB(b);
        if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
        if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
        return n > 0 ? n.toLocaleString() : "NONE";
    };

    row.innerHTML = [
        `<div class="tile ${isT ? 'match-exact' : 'match-none'} p-0 flip-in"><img src="${g.image}"></div>`,
        `<div class="tile ${g.gender === targetChar.gender ? 'match-exact' : 'match-none'} flip-in">${g.gender}</div>`,
        `<div class="tile ${g.species === targetChar.species ? 'match-exact' : 'match-none'} flip-in">${g.species}</div>`,
        `<div class="tile ${g.calling === targetChar.calling ? 'match-exact' : 'match-none'} flip-in">${g.calling}</div>`,
        `<div class="tile ${g.affiliation === targetChar.affiliation ? 'match-exact' : 'match-none'} flip-in">${g.affiliation}</div>`,
        `<div class="tile ${g.devilFruitType === targetChar.devilFruitType ? 'match-exact' : 'match-none'} flip-in">${g.devilFruitType}</div>`,
        `<div class="tile ${JSON.stringify(g.haki) === JSON.stringify(targetChar.haki) ? 'match-exact' : (g.haki.some(x => targetChar.haki.includes(x)) ? 'match-partial' : 'match-none')} flip-in">${g.haki.map(x => x.substring(0,3)).join('/').toUpperCase()}</div>`,
        `<div class="tile ${g.heightCm === targetChar.heightCm ? 'match-exact' : 'match-none'} flip-in">${g.heightCm}cm${getArrow(g.heightCm, targetChar.heightCm)}</div>`,
        `<div class="tile ${parseB(g.bounty) === parseB(targetChar.bounty) ? 'match-exact' : 'match-none'} flip-in">${formatB(g.bounty)}${getArrow(parseB(g.bounty), parseB(targetChar.bounty))}</div>`,
        `<div class="tile ${g.seaOfBirth === targetChar.seaOfBirth ? 'match-exact' : 'match-none'} flip-in">${g.seaOfBirth}</div>`,
        `<div class="tile ${g.firstArc === targetChar.firstArc ? 'match-exact' : 'match-none'} flip-in">${g.firstArc}${getArrow(arcOrder.indexOf(g.firstArc), arcOrder.indexOf(targetChar.firstArc))}</div>`
    ].join('');
    board.insertBefore(row, board.children[1]);
}

function triggerEnd(win) {
    win ? winSound.play() : loseSound.play();
    const o = document.getElementById('end-overlay');
    const modal = document.getElementById('end-modal');
    document.getElementById('card-title').innerText = win ? "SYNCHRONIZED" : "LOST CONNECTION";
    document.getElementById('card-title').style.color = win ? "#00f2ff" : "#ff4444";
    document.getElementById('modal-img').src = targetChar.image; document.getElementById('modal-img').classList.remove('hidden');
    const stats = [{l:'Sex',v:targetChar.gender},{l:'Race',v:targetChar.species},{l:'Role',v:targetChar.calling},{l:'Group',v:targetChar.affiliation},{l:'Fruit',v:targetChar.devilFruitType},{l:'Haki',v:targetChar.haki.join(', ')},{l:'Size',v:targetChar.heightCm+'cm'},{l:'Value',v:targetChar.bounty},{l:'Origin',v:targetChar.seaOfBirth},{l:'Debut',v:targetChar.firstArc}];
    document.getElementById('modal-profile').innerHTML = stats.map(s => `<div class="modal-stat-box"><span class="modal-stat-label">${s.l}</span><span class="modal-stat-value">${s.v}</span></div>`).join('');
    o.classList.remove('hidden'); o.classList.add('flex');
    setTimeout(() => { o.classList.add('opacity-100'); modal.classList.add('scale-100'); }, 50);
}
