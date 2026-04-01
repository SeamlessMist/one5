let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames = [];

// --- MHA SPECIFIC ARC ORDER ---
const arcOrder = [
    "Entrance Exam Arc", 
    "Quirk Apprehension Test Arc", 
    "Battle Trial Arc", 
    "U.S.J. Arc",
    "U.A. Sports Festival Arc", 
    "Two Heroes Movie", 
    "Vs. Hero Killer Arc", 
    "Final Exams Arc", 
    "Forest Training Camp Arc", 
    "Hideout Raid Arc", 
    "Provisional Hero License Exam Arc", 
    "Shie Hassaikai Arc", 
    "Remedial Course Arc", 
    "U.A. School Festival Arc", 
    "Pro Hero Arc", 
    "Joint Training Arc", 
    "Meta Liberation Army Arc", 
    "Heroes Rising Movie", 
    "Endeavor Agency Arc / World Heroes Mission", 
    "Paranormal Liberation War Arc", 
    "Dark Hero Arc", 
    "Star and Stripe Arc", 
    "U.A. Traitor Arc", 
    "You're Next Movie", 
    "Final War Arc", 
    "Epilogue Arc"
];

// --- AUDIO ASSETS ---
const winSound = new Audio('allmight_win.mp3');
const loseSound = new Audio('shigaraki_lose.mp3'); 
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

// --- INIT ---
window.onload = async () => {
    try {
        const res = await fetch('characters.json');
        if (!res.ok) throw new Error("JSON missing");
        characters = await res.json();
        initUI();
        setMode('daily');
    } catch (e) {
        console.error(e);
        alert("CRITICAL ERROR: MHA characters.json not found.");
    }
};

function initUI() {
    document.getElementById('btn-daily').onclick = () => setMode('daily');
    document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
    document.getElementById('btn-replay').onclick = () => resetGame();
    setupSearch();
    setupArcModal();
}

// --- MODE SWITCHER ---
function setMode(newMode) {
    mode = newMode;
    const pill = document.getElementById('mode-pill');
    const dBtn = document.getElementById('btn-daily');
    const uBtn = document.getElementById('btn-unlimited');

    if (mode === 'daily') {
        pill.style.left = '4px';
        pill.style.right = 'auto';
        dBtn.classList.add('active');
        uBtn.classList.remove('active');
    } else {
        pill.style.left = 'calc(50%)';
        pill.style.right = '4px';
        uBtn.classList.add('active');
        dBtn.classList.remove('active');
    }
    resetGame();
}

// --- RESET ---
function resetGame() {
    guesses = 0;
    updateCounter();

    document.getElementById('game-board').innerHTML = `
        <div class="w-full grid grid-cols-7 gap-2 mb-1 px-2 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <div>Character</div>
            <div>Gender</div>
            <div>Quirk Type</div>
            <div>Calling</div>
            <div>Affiliation</div>
            <div>Height</div>
            <div>Debut</div>
        </div>`;
    
    const overlay = document.getElementById('end-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex', 'opacity-100');
    
    const input = document.getElementById('search-input');
    input.disabled = false;
    input.value = '';
    
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

// --- SEARCH & DROPDOWN ---
function setupSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('dropdown');

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        if (!val) { dropdown.classList.add('hidden'); return; }

        const matches = filteredNames.filter(n => n.toLowerCase().includes(val));
        if (matches.length > 0) {
            dropdown.classList.remove('hidden');
            matches.slice(0, 10).forEach(name => {
                const char = characters.find(c => c.name === name);
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerHTML = `
                    <img src="${char.imageUrl || 'placeholder.png'}" alt="${char.name}" onerror="this.src='placeholder.png'">
                    <span>${char.name}</span>
                `;
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

    document.addEventListener('mousedown', (e) => {
        if (e.target !== input && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const firstItem = dropdown.querySelector('.dropdown-item');
            if (firstItem) {
                input.value = firstItem.querySelector('span').textContent;
                dropdown.classList.add('hidden');
                executeGuess();
            }
        }
    });
}

// --- GUESS EXECUTION ---
function executeGuess() {
    const input = document.getElementById('search-input');
    const guessName = input.value.trim();
    const char = characters.find(c => c.name === guessName);
    
    if (!char || !filteredNames.includes(guessName)) return;

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

// --- BUILD GUESS ROW ---
function buildRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-7 gap-2 px-2';
    
    const isT = g.name === targetChar.name;

    const tilesHTML = [
        // Image tile
        `<div class="tile img-tile ${isT ? 'match-exact' : 'match-none'} flip-in">
            <img src="${g.imageUrl || 'placeholder.png'}" alt="${g.name}" title="${g.name}" onerror="this.src='placeholder.png'">
         </div>`,
        getTileHTML(g.Gender,        g.Gender === targetChar.Gender ? 'match-exact' : 'match-none'),
        getTileHTML(g["Quirk Type"], g["Quirk Type"] === targetChar["Quirk Type"] ? 'match-exact' : 'match-none'),
        getTileHTML(g.Calling,       g.Calling === targetChar.Calling ? 'match-exact' : 'match-none'),
        getTileHTML(g.Affiliation,   g.Affiliation === targetChar.Affiliation ? 'match-exact' : 'match-none'),
        getTileHTML(g.Height + 'cm', compStat(g.Height, targetChar.Height)),
        getTileHTML(g.Debut,         compArc(g.Debut, targetChar.Debut))
    ].join('');

    row.innerHTML = tilesHTML;
    // Insert after header row
    board.insertBefore(row, board.children[1]);

    row.querySelectorAll('.flip-in').forEach((t, i) => {
        t.style.animationDelay = `${i * 0.06}s`;
    });
}

function getTileHTML(val, type) {
    const cssClass = type.includes('▲') || type.includes('▼') ? 'match-none' : type;
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="tile ${cssClass} flip-in">${val}${arrow}</div>`;
}

// --- COMPARISON HELPERS ---
function compStat(g, t) { 
    if (g === t) return 'match-exact'; 
    return g < t ? 'match-none ▲' : 'match-none ▼'; 
}

function compArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

// --- END GAME MODAL ---
function triggerEnd(win) {
    playLaugh(win);
    
    const title = document.getElementById('end-title');
    const subtitle = document.getElementById('end-subtitle');

    title.innerText = win ? "GO BEYOND! PLUS ULTRA!" : "DEFEATED BY VILLAINS!";
    title.style.color = win ? "#fde047" : "#ef4444";
    subtitle.innerText = win
        ? `You recognised ${targetChar.name} in ${guesses} guess${guesses !== 1 ? 'es' : ''}.`
        : `The answer was ${targetChar.name}.`;

    // Character image
    let modalImg = document.getElementById('end-modal-img');
    if (!modalImg) {
        modalImg = document.createElement('img');
        modalImg.id = 'end-modal-img';
        document.getElementById('end-title').insertAdjacentElement('beforebegin', modalImg);
    }
    modalImg.src = targetChar.imageUrl || 'placeholder.png';

    // Stats grid
    const profileContainer = document.getElementById('modal-profile');
    const stats = [
        { l: 'Gender',      v: targetChar.Gender },
        { l: 'Quirk',       v: targetChar["Quirk Type"] },
        { l: 'Calling',     v: targetChar.Calling },
        { l: 'Group',       v: targetChar.Affiliation },
        { l: 'Height',      v: targetChar.Height + 'cm' },
        { l: 'Debut',       v: targetChar.Debut }
    ];

    profileContainer.innerHTML = stats.map(s => `
        <div class="modal-stat-box">
            <span class="modal-stat-label">${s.l}</span>
            <span class="modal-stat-value">${s.v}</span>
        </div>
    `).join('');

    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    setTimeout(() => overlay.classList.add('opacity-100'), 50);
}

// --- ARC LIST MODAL ---
function setupArcModal() {
    const btn = document.getElementById('btn-arclist');
    const overlay = document.getElementById('arc-overlay');
    const closeBtn = document.getElementById('btn-arc-close');
    const listEl = document.getElementById('arc-list-content');

    // Populate arc list
    arcOrder.forEach((arc, i) => {
        const item = document.createElement('div');
        item.className = 'arc-item';
        item.innerHTML = `
            <span class="arc-num">${i + 1}</span>
            <span class="arc-name">${arc}</span>
        `;
        listEl.appendChild(item);
    });

    btn.onclick = () => {
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('open'));
    };

    closeBtn.onclick = closeArcModal;
    overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) closeArcModal();
    });
}

function closeArcModal() {
    const overlay = document.getElementById('arc-overlay');
    overlay.classList.remove('open');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}
