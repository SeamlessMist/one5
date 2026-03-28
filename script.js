// --- 1. STATE & DATA ---
let characters =[];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames =[];

const arcOrder =[
    "Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown",
    "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta",
    "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark",
    "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island",
    "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"
];

// --- 2. LOCAL AUDIO ENGINE --- 
const winSound = new Audio('luffy.mp3');
const loseSound = new Audio('doffy.mp3');
let audioUnlocked = false;

// Wakes up the audio engine on the very first click
function unlockAudio() {
    if (audioUnlocked) return;
    winSound.play().then(() => { winSound.pause(); winSound.currentTime = 0; }).catch(() => {});
    loseSound.play().then(() => { loseSound.pause(); loseSound.currentTime = 0; }).catch(() => {});
    audioUnlocked = true;
    document.removeEventListener('pointerdown', unlockAudio);
    console.log("Audio Unlocked");
}
document.addEventListener('pointerdown', unlockAudio);

function playLaugh(isWin) {
    if (!audioUnlocked) return;
    const sound = isWin ? winSound : loseSound;
    sound.currentTime = 0;
    sound.volume = 0.6;
    sound.play().catch(e => console.warn("Audio blocked or missing:", e));
}

// --- 3. INITIALIZATION ---
window.onload = async () => {
    try {
        const res = await fetch('characters.json');
        if (!res.ok) throw new Error("JSON file missing");
        characters = await res.json();
        initUI();
        setMode('daily');
    } catch (e) {
        console.error(e);
        alert("ERROR: characters.json not found!");
    }
};

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
    
    // Clear board, preserve header
    const board = document.getElementById('game-board');
    const header = board.firstElementChild;
    board.innerHTML = '';
    board.appendChild(header);
    
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('end-overlay').classList.remove('opacity-100');
    document.getElementById('end-modal').classList.remove('scale-100');
    
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

// --- 4. SEARCH ---
function setupSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('autocomplete-list');

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
                div.innerHTML = `<img src="${char.image || 'placeholder.png'}"> <span>${char.name}</span>`;
                div.onclick = () => {
                    input.value = char.name;
                    dropdown.classList.add('hidden');
                    executeGuess();
                };
                dropdown.appendChild(div);
            });
        } else {
            dropdown.classList.add('hidden');
        }
    });

    // Close if clicked outside
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== dropdown) dropdown.classList.add('hidden');
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

    if (char.name === targetChar.name) {
        input.disabled = true;
        setTimeout(() => triggerEnd(true), 1200);
    } else if (guesses >= MAX_GUESSES) {
        input.disabled = true;
        setTimeout(() => triggerEnd(false), 1200);
    }
}

// --- 5. RENDER & HELPERS ---
function renderRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 px-2 mb-2';
    
    const isT = g.name === targetChar.name;
    const getArrow = (gu, ta) => gu === ta ? '' : (gu < ta ? ' ▲' : ' ▼');

    const tilesHTML =[
        `<div class="tile ${isT ? 'match-exact' : 'match-none'} p-0 flip-in"><img src="${g.image || 'placeholder.png'}"></div>`,
        getTileHTML(g.gender, g.gender === targetChar.gender ? 'match-exact' : 'match-none'),
        getTileHTML(g.species, g.species === targetChar.species ? 'match-exact' : 'match-none'),
        getTileHTML(g.calling, g.calling === targetChar.calling ? 'match-exact' : 'match-none'),
        getTileHTML(g.affiliation, g.affiliation === targetChar.affiliation ? 'match-exact' : 'match-none'),
        getTileHTML(g.devilFruitType, g.devilFruitType === targetChar.devilFruitType ? 'match-exact' : 'match-none'),
        getTileHTML(formatHaki(g.haki), compHaki(g.haki, targetChar.haki)),
        getTileHTML(g.heightCm + 'cm' + getArrow(g.heightCm, targetChar.heightCm), g.heightCm === targetChar.heightCm ? 'match-exact' : 'match-none'),
        getTileHTML(formatBounty(g.bounty) + getArrow(parseBounty(g.bounty), parseBounty(targetChar.bounty)), parseBounty(g.bounty) === parseBounty(targetChar.bounty) ? 'match-exact' : 'match-none'),
        getTileHTML(g.seaOfBirth, g.seaOfBirth === targetChar.seaOfBirth ? 'match-exact' : 'match-none'),
        getTileHTML(g.firstArc, compArc(g.firstArc, targetChar.firstArc))
    ].join('');

    row.innerHTML = tilesHTML;
    board.insertBefore(row, board.children[1]); // Prepend below header

    const tileElements = row.querySelectorAll('.flip-in');
    tileElements.forEach((t, i) => t.style.animationDelay = `${i * 0.05}s`);
}

function getTileHTML(val, type) {
    return `<div class="tile ${type} flip-in">${val}</div>`;
}

function formatHaki(h) { 
    if (!h || h.length === 0 || h[0] === "None") return "NONE"; 
    return h.map(x => {
        if(x.toLowerCase().includes('conq')) return 'CON';
        if(x.toLowerCase().includes('arm')) return 'ARM';
        if(x.toLowerCase().includes('obs')) return 'OBS';
        return x.substring(0,3).toUpperCase();
    }).join('/'); 
}

function compHaki(g, t) { 
    if (JSON.stringify(g) === JSON.stringify(t)) return 'match-exact'; 
    return g.some(x => t.includes(x)) ? 'match-partial' : 'match-none'; 
}

function parseBounty(b) { return parseInt(b.toString().replace(/[^0-9]/g, '')) || 0; }

function formatBounty(b) {
    let n = parseBounty(b);
    if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    return n > 0 ? n.toLocaleString() : "NONE";
}

function compArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

// --- 6. END GAME MODAL ---
function triggerEnd(win) {
    playLaugh(win);
    
    // Set Title Colors
    const titleNode = document.getElementById('card-title');
    titleNode.innerText = win ? "DATA SYNCHRONIZED" : "CONNECTION LOST";
    titleNode.className = win ? "font-mono text-3xl font-bold mb-4 tracking-tighter uppercase text-[#00f2ff]" : "font-mono text-3xl font-bold mb-4 tracking-tighter uppercase text-[#ff4444]";

    // Inject Image into Modal
    const imgNode = document.getElementById('modal-img');
    imgNode.src = targetChar.image || 'placeholder.png';
    imgNode.classList.remove('hidden');

    // Populate Stats
    const stats =[
        { l: 'Sex', v: targetChar.gender }, { l: 'Race', v: targetChar.species },
        { l: 'Role', v: targetChar.calling }, { l: 'Group', v: targetChar.affiliation },
        { l: 'Fruit', v: targetChar.devilFruitType }, { l: 'Haki', v: formatHaki(targetChar.haki) },
        { l: 'Height', v: targetChar.heightCm + 'cm' }, { l: 'Bounty', v: formatBounty(targetChar.bounty) },
        { l: 'Origin', v: targetChar.seaOfBirth }, { l: 'Debut', v: targetChar.firstArc }
    ];

    document.getElementById('modal-profile').innerHTML = stats.map(s => `
        <div class="modal-stat-box">
            <span class="modal-stat-label">${s.l}</span>
            <span class="modal-stat-value">${s.v}</span>
        </div>
    `).join('');

    // Show Overlay
    const overlay = document.getElementById('end-overlay');
    const modal = document.getElementById('end-modal');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    setTimeout(() => {
        overlay.classList.add('opacity-100');
        modal.classList.add('scale-100');
        modal.classList.remove('scale-95');
    }, 50);
}
