let characters =[];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames =[];
let currentFocus = -1;

const arcOrder =[
    "Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown",
    "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta",
    "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark",
    "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island",
    "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"
];

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

function playLaugh(isWin) {
    const sound = isWin ? winSound : loseSound;
    sound.currentTime = 0;
    sound.volume = 0.5;
    sound.play().catch(e => console.warn("Audio blocked or file missing."));
}

window.onload = async () => {
    try {
        const res = await fetch('characters.json');
        if (!res.ok) throw new Error("JSON missing");
        characters = await res.json();
        
        initUI();
        setMode('daily');
    } catch (e) {
        console.error(e);
        alert("CRITICAL ERROR: characters.json not found.");
    }
};

function initUI() {
    document.getElementById('btn-daily').onclick = () => setMode('daily');
    document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
    document.getElementById('btn-replay').onclick = () => resetGame();
    setupSearch();
}

function setMode(newMode) {
    mode = newMode;
    const toggleContainer = document.getElementById('btn-daily').parentElement;
    const dBtn = document.getElementById('btn-daily');
    const uBtn = document.getElementById('btn-unlimited');

    if (mode === 'daily') {
        toggleContainer.classList.add('daily-active');
        toggleContainer.classList.remove('unlim-active');
        dBtn.classList.add('active');
        uBtn.classList.remove('active');
    } else {
        toggleContainer.classList.add('unlim-active');
        toggleContainer.classList.remove('daily-active');
        uBtn.classList.add('active');
        dBtn.classList.remove('active');
    }
    resetGame();
}

function resetGame() {
    guesses = 0;
    updateCounter();
    document.getElementById('game-board').innerHTML = `
        <div class="w-full grid grid-cols-11 gap-2 mb-2 px-2 text-center text-white/50 text-[10px] font-bold uppercase tracking-wider">
            <div>Character</div><div>Gender</div><div>Species</div><div>Calling</div>
            <div>Affiliation</div><div>Fruit</div><div>Haki</div><div>Height</div>
            <div>Bounty</div><div>Origin</div><div>Debut</div>
        </div>`;
    
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('end-overlay').classList.remove('flex', 'opacity-100');
    
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

function updateCounter() {
    document.getElementById('guess-counter').innerText = Math.max(0, MAX_GUESSES - guesses);
}

// --- SEARCH FIXES ---
function setupSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('dropdown');

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        currentFocus = -1;

        if (!val) { dropdown.classList.add('hidden'); return; }

        const matches = filteredNames.filter(n => n.toLowerCase().includes(val));
        if (matches.length > 0) {
            dropdown.classList.remove('hidden');
            matches.slice(0, 10).forEach(name => {
                const char = characters.find(c => c.name === name);
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                // Styling for Dropdown Items with Images
                div.style.cssText = "display: flex; align-items: center; gap: 12px; padding: 10px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer; color: black; font-weight: 800; text-transform: uppercase;";
                div.innerHTML = `<img src="${char.image || 'placeholder.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(0,0,0,0.1);"> <span>${char.name}</span>`;
                
                // Mousedown is used here so it fires BEFORE the input loses focus
                div.onmousedown = (event) => { 
                    event.preventDefault(); 
                    input.value = name; 
                    dropdown.classList.add('hidden'); 
                    executeGuess(); 
                };
                dropdown.appendChild(div);
            });
        } else {
            dropdown.classList.add('hidden');
        }
    });

    // Hide dropdown if clicked outside
    document.addEventListener('mousedown', (e) => {
        if (e.target !== input && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function executeGuess() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('dropdown');
    const guessName = input.value.trim();
    
    const char = characters.find(c => c.name === guessName);
    if (!char || !filteredNames.includes(guessName)) return;

    dropdown.classList.add('hidden');
    input.value = '';
    filteredNames = filteredNames.filter(n => n !== guessName);
    
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

// --- IMAGE RENDER IN GRID ---
function buildRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 mb-2 px-2';
    
    const isT = g.name === targetChar.name;
    const tilesHTML =[
        // Replaced Name Text with Image Box
        `<div class="tile ${isT ? 'match-exact' : 'match-none'} flip-in" style="padding: 0; overflow: hidden;">
            <img src="${g.image || 'placeholder.png'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 11px;" title="${g.name}">
         </div>`,
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

    row.innerHTML = tilesHTML;
    board.insertBefore(row, board.children[1]); 

    const tileElements = row.querySelectorAll('.flip-in');
    tileElements.forEach((t, i) => t.style.animationDelay = `${i * 0.05}s`);
}

function getTileHTML(val, type) {
    const baseClass = type.split(' ')[0]; 
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="tile ${baseClass} flip-in">${val}${arrow}</div>`;
}

// --- HELPERS ---
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

function compStat(g, t) { if (g === t) return 'match-exact'; return g < t ? 'match-none ▲' : 'match-none ▼'; }
function parseBounty(b) { return parseInt(b.toString().replace(/[^0-9]/g, '')) || 0; }

function formatBounty(b) {
    let n = parseBounty(b);
    if (n >= 1e9) return parseFloat((n / 1e9).toFixed(2)) + 'B';
    if (n >= 1e6) return parseFloat((n / 1e6).toFixed(2)) + 'M';
    return n > 0 ? n.toLocaleString() : "NONE";
}

function compArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

// --- END GAME MODAL ---
function triggerEnd(win) {
    playLaugh(win);
    
    document.getElementById('end-title').innerText = win ? "BOUNTY CLAIMED!" : "WALK THE PLANK!";
    document.getElementById('end-title').style.color = win ? "#a38900" : "#ef4444";
    document.getElementById('end-subtitle').innerText = win ? `You identified ${targetChar.name}.` : `The character was ${targetChar.name}.`;

    // Handle Profile Image Injection
    let modalImg = document.getElementById('end-modal-img');
    if (!modalImg) {
        modalImg = document.createElement('img');
        modalImg.id = 'end-modal-img';
        modalImg.style.cssText = "width: 140px; height: 140px; border-radius: 20px; object-fit: cover; margin: 0 auto 15px; border: 4px solid white; display: block; box-shadow: 0 10px 25px rgba(0,0,0,0.2);";
        document.getElementById('end-title').after(modalImg);
    }
    modalImg.src = targetChar.image;

    const profileContainer = document.getElementById('modal-profile');
    const stats =[
        { l: 'Gender', v: targetChar.gender }, { l: 'Species', v: targetChar.species },
        { l: 'Role', v: targetChar.calling }, { l: 'Group', v: targetChar.affiliation },
        { l: 'Fruit', v: targetChar.devilFruitType }, { l: 'Haki', v: formatHaki(targetChar.haki) },
        { l: 'Height', v: targetChar.heightCm + 'cm' }, { l: 'Bounty', v: formatBounty(targetChar.bounty) },
        { l: 'Origin', v: targetChar.seaOfBirth }, { l: 'Debut', v: targetChar.firstArc }
    ];

    profileContainer.innerHTML = stats.map(s => `
        <div class="modal-stat-box" style="background: rgba(0,0,0,0.05); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(0,0,0,0.1);">
            <span style="font-size: 8px; font-weight: 800; color: rgba(0,0,0,0.5); text-transform: uppercase; margin-bottom: 2px; font-family: 'Manrope', sans-serif;">${s.l}</span>
            <span style="font-size: 11px; font-weight: 700; color: #000; text-transform: uppercase; font-family: 'Space Grotesk', sans-serif;">${s.v}</span>
        </div>
    `).join('');

    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    setTimeout(() => { overlay.classList.add('opacity-100'); }, 50);
}
