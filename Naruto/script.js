let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames = [];

// --- NARUTO ARC ORDER ---
const arcOrder = [
    "Prologue — Land of Waves", "Chūnin Exams", "Konoha Crush", "Search for Tsunade",
    "Sasuke Recovery Mission", "Kazekage Rescue Mission", "Tenchi Bridge Reconnaissance Mission",
    "Akatsuki Suppression Mission", "Itachi Pursuit Mission", "Tale of Jiraiya the Gallant",
    "Fated Battle Between Brothers", "Pain's Assault", "Five Kage Summit",
    "Fourth Shinobi World War: Confrontation", "Fourth Shinobi World War: Climax",
    "Birth of the Ten-Tails' Jinchūriki", "Kaguya Ōtsutsuki Strikes", "Final Battle", "Epilogue"
];

// --- AUDIO ---
const winSound = new Audio('naruto_win.mp3');
const loseSound = new Audio('naruto_lose.mp3');

window.onload = async () => {
    try {
        const res = await fetch('characters.json');
        characters = await res.json();
        initUI();
        setMode('daily');
    } catch (e) {
        console.error("JSON Error:", e);
    }
};

function initUI() {
    document.getElementById('btn-daily').onclick = () => setMode('daily');
    document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
    document.getElementById('btn-replay').onclick = () => resetGame();
    setupSearch();
    setupArcModal();
}

function setMode(newMode) {
    mode = newMode;
    const pill = document.getElementById('mode-pill');
    if (mode === 'daily') {
        pill.style.left = '4px';
        document.getElementById('btn-daily').classList.add('active');
        document.getElementById('btn-unlimited').classList.remove('active');
    } else {
        pill.style.left = 'calc(50%)';
        document.getElementById('btn-unlimited').classList.add('active');
        document.getElementById('btn-daily').classList.remove('active');
    }
    resetGame();
}

function resetGame() {
    guesses = 0;
    updateCounter();
    
    document.getElementById('game-board').innerHTML = `
        <div class="w-full grid grid-cols-11 gap-2 mb-1 px-2 text-center text-white/40 text-[9px] font-black uppercase tracking-[0.1em]">
            <div>Character</div><div>Gender</div><div>Species</div><div>Ninja?</div><div>Affiliation</div>
            <div>Chakra</div><div>Specialty</div><div>Kekkei Genkai</div><div>Rank</div><div>Height</div><div>Debut</div>
        </div>`;
    
    const overlay = document.getElementById('end-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex', 'opacity-100');
    
    document.getElementById('search-input').disabled = false;
    document.getElementById('search-input').value = '';
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
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('dropdown');
    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        dropdown.innerHTML = '';
        if (!val) return dropdown.classList.add('hidden');
        const matches = filteredNames.filter(n => n.toLowerCase().includes(val)).slice(0, 10);
        if (matches.length) {
            dropdown.classList.remove('hidden');
            matches.forEach(name => {
                const c = characters.find(char => char.name === name);
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerHTML = `<img src="${c.image}"><span>${c.name}</span>`;
                div.onmousedown = () => { input.value = name; executeGuess(); };
                dropdown.appendChild(div);
            });
        }
    });
}

function executeGuess() {
    const input = document.getElementById('search-input');
    const char = characters.find(c => c.name === input.value);
    if (!char || !filteredNames.includes(char.name)) return;

    input.value = '';
    document.getElementById('dropdown').classList.add('hidden');
    filteredNames = filteredNames.filter(n => n !== char.name);
    guesses++;
    updateCounter();
    buildRow(char);

    if (char.name === targetChar.name) {
        input.disabled = true;
        setTimeout(() => triggerEnd(true), 1200);
    } else if (guesses >= MAX_GUESSES) {
        input.disabled = true;
        setTimeout(() => triggerEnd(false), 1200);
    }
}

function buildRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 px-2';
    const isT = g.name === targetChar.name;

    row.innerHTML = [
        `<div class="tile img-tile ${isT ? 'match-exact' : 'match-none'} flip-in"><img src="${g.image}"></div>`,
        getTileHTML(g.gender, g.gender === targetChar.gender ? 'match-exact' : 'match-none'),
        getTileHTML(g.species, g.species === targetChar.species ? 'match-exact' : 'match-none'),
        getTileHTML(g.isNinja, g.isNinja === targetChar.isNinja ? 'match-exact' : 'match-none'),
        getTileHTML(g.affiliation, g.affiliation === targetChar.affiliation ? 'match-exact' : 'match-none'),
        getTileHTML(formatChakra(g.chakraNature), compChakra(g.chakraNature, targetChar.chakraNature)),
        getTileHTML(g.ninjutsuSpecialty, g.ninjutsuSpecialty === targetChar.ninjutsuSpecialty ? 'match-exact' : 'match-none'),
        getTileHTML(g.kekkeiGenkai, g.kekkeiGenkai === targetChar.kekkeiGenkai ? 'match-exact' : 'match-none'),
        getTileHTML(g.ninjaRank, g.ninjaRank === targetChar.ninjaRank ? 'match-exact' : 'match-none'),
        getTileHTML(g.height, compStat(parseHeight(g.height), parseHeight(targetChar.height))),
        getTileHTML(g.debut, compArc(g.debut, targetChar.debut))
    ].join('');

    board.insertBefore(row, board.children[1]);
    row.querySelectorAll('.flip-in').forEach((t, i) => t.style.animationDelay = `${i * 0.05}s`);
}

// --- LOGIC HELPERS ---

// Chakra partial match (Blue)
function compChakra(g, t) {
    if (!g || !t) return 'match-none';
    const matchesAll = g.length === t.length && g.every(c => t.includes(c));
    if (matchesAll) return 'match-exact';
    if (g.some(c => t.includes(c))) return 'match-partial'; 
    return 'match-none';
}

function formatChakra(c) { 
    if (!c || c.length === 0 || c[0] === "None") return "NONE"; 
    return c.join(' '); // Renders the emojis side by side
}

// Parses "180 cm" to 180 for Up/Down logic
function parseHeight(h) { 
    return parseFloat(h.toString().replace(/[^0-9.]/g, '')) || 0; 
}

function compStat(g, t) { 
    if (g === t) return 'match-exact'; 
    return g < t ? 'match-none ▲' : 'match-none ▼'; 
}

function compArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

function updateCounter() { document.getElementById('guess-counter').innerText = MAX_GUESSES - guesses; }

function getTileHTML(val, type) {
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    // Increase font size slightly for emojis
    const fontSize = val.includes('💨') || val.includes('🔥') || val.includes('⚡') ? 'text-[12px]' : '';
    return `<div class="tile ${type.split(' ')[0]} ${fontSize} flip-in">${val}${arrow}</div>`;
}

// --- END GAME MODAL ---
function triggerEnd(win) {
    const sound = win ? winSound : loseSound;
    sound.currentTime = 0;
    sound.play().catch(() => {});

    const title = document.getElementById('end-title');
    const subtitle = document.getElementById('end-subtitle');

    title.innerText = win ? "DATTEBAYO! MISSION COMPLETE!" : "MISSION FAILED!";
    title.style.color = win ? "#fde047" : "#ef4444";
    subtitle.innerText = win ? `You identified ${targetChar.name} in ${guesses} guesses.` : `The answer was ${targetChar.name}.`;
    
    let modalImg = document.getElementById('end-modal-img');
    if (!modalImg) {
        modalImg = document.createElement('img');
        modalImg.id = 'end-modal-img';
        document.getElementById('end-title').insertAdjacentElement('beforebegin', modalImg);
    }
    modalImg.src = targetChar.image;

    const profile = document.getElementById('modal-profile');
    const stats = [
        {l:'Gender', v:targetChar.gender}, {l:'Species', v:targetChar.species},
        {l:'Ninja?', v:targetChar.isNinja}, {l:'Affiliation', v:targetChar.affiliation},
        {l:'Chakra', v:formatChakra(targetChar.chakraNature)}, {l:'Specialty', v:targetChar.ninjutsuSpecialty},
        {l:'Kekkei Genkai', v:targetChar.kekkeiGenkai}, {l:'Rank', v:targetChar.ninjaRank},
        {l:'Debut', v:targetChar.debut}
    ];
    // Changed grid-cols from 3 to dynamically fit to avoid cramped text
    profile.style.gridTemplateColumns = "repeat(3, 1fr)";
    profile.innerHTML = stats.map(s => `<div class="modal-stat-box"><span class="modal-stat-label">${s.l}</span><span class="modal-stat-value">${s.v}</span></div>`).join('');

    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    setTimeout(() => overlay.classList.add('opacity-100'), 50);
}

function setupArcModal() {
    const overlay = document.getElementById('arc-overlay');
    const listEl = document.getElementById('arc-list-content');
    listEl.innerHTML = '';
    arcOrder.forEach((arc, i) => {
        const item = document.createElement('div');
        item.className = 'arc-item';
        item.innerHTML = `<span class="arc-num">${i + 1}</span><span class="arc-name">${arc}</span>`;
        listEl.appendChild(item);
    });
    document.getElementById('btn-arclist').onclick = () => { overlay.style.display = 'flex'; setTimeout(()=>overlay.classList.add('open'),10); };
    document.getElementById('btn-arc-close').onclick = () => { overlay.classList.remove('open'); setTimeout(()=>overlay.style.display='none',300); };
}
