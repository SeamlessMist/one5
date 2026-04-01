let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames = [];

const arcOrder = [
    "Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown",
    "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta",
    "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark",
    "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island",
    "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano Country", "Egghead"
];

const winSound = new Audio('luffy.mp3');
const loseSound = new Audio('doffy.mp3');

window.onload = async () => {
    const res = await fetch('characters.json');
    characters = await res.json();
    initUI();
    setMode('daily');
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
            <div>Char</div><div>Gender</div><div>Species</div><div>Role</div><div>Group</div>
            <div>Fruit</div><div>Haki</div><div>Height</div><div>Bounty</div><div>Origin</div><div>Debut</div>
        </div>`;
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('search-input').disabled = false;
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
    if (char.name === targetChar.name) setTimeout(() => triggerEnd(true), 1200);
    else if (guesses >= MAX_GUESSES) setTimeout(() => triggerEnd(false), 1200);
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
        getTileHTML(g.calling, g.calling === targetChar.calling ? 'match-exact' : 'match-none'),
        getTileHTML(g.affiliation, g.affiliation === targetChar.affiliation ? 'match-exact' : 'match-none'),
        getTileHTML(g.devilFruitType, g.devilFruitType === targetChar.devilFruitType ? 'match-exact' : 'match-none'),
        getTileHTML(formatHaki(g.haki), compHaki(g.haki, targetChar.haki)),
        getTileHTML(g.heightCm + 'cm', compStat(g.heightCm, targetChar.heightCm)),
        getTileHTML(formatBounty(g.bounty), compStat(parseBounty(g.bounty), parseBounty(targetChar.bounty))),
        getTileHTML(g.seaOfBirth, g.seaOfBirth === targetChar.seaOfBirth ? 'match-exact' : 'match-none'),
        getTileHTML(g.firstArc, compArc(g.firstArc, targetChar.firstArc))
    ].join('');

    board.insertBefore(row, board.children[1]);
    row.querySelectorAll('.flip-in').forEach((t, i) => t.style.animationDelay = `${i * 0.05}s`);
}

// --- LOGIC ---
function compHaki(g, t) {
    const matchesAll = g.length === t.length && g.every(h => t.includes(h));
    if (matchesAll) return 'match-exact';
    if (g.some(h => t.includes(h))) return 'match-partial'; // Blue Glow
    return 'match-none';
}

function formatHaki(h) { 
    if (!h || h.length === 0 || h[0] === "None") return "NONE"; 
    return h.map(x => x.substring(0,3).toUpperCase()).join('/'); 
}

function parseBounty(b) { return parseInt(b.toString().replace(/[^0-9]/g, '')) || 0; }
function formatBounty(b) {
    let n = parseBounty(b);
    if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(0) + 'M';
    return n > 0 ? n.toLocaleString() : "NONE";
}

function compStat(g, t) { if (g === t) return 'match-exact'; return g < t ? 'match-none ▲' : 'match-none ▼'; }
function compArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

function updateCounter() { document.getElementById('guess-counter').innerText = MAX_GUESSES - guesses; }

function getTileHTML(val, type) {
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="tile ${type.split(' ')[0]} flip-in">${val}${arrow}</div>`;
}

function triggerEnd(win) {
    const sound = win ? winSound : loseSound;
    sound.play();
    document.getElementById('end-title').innerText = win ? "KING OF THE PIRATES!" : "WALK THE PLANK!";
    document.getElementById('end-title').style.color = win ? "#fde047" : "#ef4444";
    document.getElementById('end-subtitle').innerText = `You identified ${targetChar.name}.`;
    
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
        {l:'Role', v:targetChar.calling}, {l:'Group', v:targetChar.affiliation},
        {l:'Fruit', v:targetChar.devilFruitType}, {l:'Haki', v:formatHaki(targetChar.haki)},
        {l:'Height', v:targetChar.heightCm+'cm'}, {l:'Bounty', v:formatBounty(targetChar.bounty)},
        {l:'Debut', v:targetChar.firstArc}
    ];
    profile.innerHTML = stats.map(s => `<div class="modal-stat-box"><span class="modal-stat-label">${s.l}</span><span class="modal-stat-value">${s.v}</span></div>`).join('');

    document.getElementById('end-overlay').classList.remove('hidden');
    document.getElementById('end-overlay').classList.add('flex');
}

function setupArcModal() {
    const overlay = document.getElementById('arc-overlay');
    const listEl = document.getElementById('arc-list-content');
    arcOrder.forEach((arc, i) => {
        const item = document.createElement('div');
        item.className = 'arc-item';
        item.innerHTML = `<span class="arc-num">${i + 1}</span><span class="arc-name">${arc}</span>`;
        listEl.appendChild(item);
    });
    document.getElementById('btn-arclist').onclick = () => { overlay.style.display = 'flex'; setTimeout(()=>overlay.classList.add('open'),10); };
    document.getElementById('btn-arc-close').onclick = () => { overlay.classList.remove('open'); setTimeout(()=>overlay.style.display='none',300); };
}
