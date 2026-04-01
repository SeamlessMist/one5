let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames = [];
let currentFocus = -1;

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
    "You’re Next Movie", 
    "Final War Arc", 
    "Epilogue Arc"
];

// --- AUDIO ASSETS ---
const winSound = new Audio('allmight_win.mp3'); // Suggested: "I am here!"
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
    // Headers updated for MHA Fields
    document.getElementById('game-board').innerHTML = `
        <div class="w-full grid grid-cols-7 gap-2 mb-2 px-2 text-center text-white/50 text-[10px] font-bold uppercase tracking-wider">
            <div>Hero</div><div>Gender</div><div>Quirk Type</div><div>Calling</div>
            <div>Affiliation</div><div>Height</div><div>Debut</div>
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
                div.style.cssText = "display: flex; align-items: center; gap: 12px; padding: 10px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer; color: black; font-weight: 800; text-transform: uppercase;";
                div.innerHTML = `<img src="${char.imageUrl || 'placeholder.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(0,0,0,0.1);"> <span>${char.name}</span>`;
                
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
}

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

function buildRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-7 gap-2 mb-2 px-2'; // 7 columns for MHA
    
    const isT = g.name === targetChar.name;
    const tilesHTML = [
        // Image Tile
        `<div class="tile ${isT ? 'match-exact' : 'match-none'} flip-in" style="padding: 0; overflow: hidden;">
            <img src="${g.imageUrl || 'placeholder.png'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 11px;" title="${g.name}">
         </div>`,
        // MHA Property Mapping
        getTileHTML(g.Gender, g.Gender === targetChar.Gender ? 'match-exact' : 'match-none'),
        getTileHTML(g["Quirk Type"], g["Quirk Type"] === targetChar["Quirk Type"] ? 'match-exact' : 'match-none'),
        getTileHTML(g.Calling, g.Calling === targetChar.Calling ? 'match-exact' : 'match-none'),
        getTileHTML(g.Affiliation, g.Affiliation === targetChar.Affiliation ? 'match-exact' : 'match-none'),
        // Arrow Logic for Height
        getTileHTML(g.Height + 'cm', compStat(g.Height, targetChar.Height)),
        // Arrow Logic for Debut
        getTileHTML(g.Debut, compArc(g.Debut, targetChar.Debut))
    ].join('');

    row.innerHTML = tilesHTML;
    board.insertBefore(row, board.children[1]); 

    row.querySelectorAll('.flip-in').forEach((t, i) => t.style.animationDelay = `${i * 0.05}s`);
}

function getTileHTML(val, type) {
    const baseClass = type.split(' ')[0]; 
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="tile ${baseClass} flip-in">${val}${arrow}</div>`;
}

// --- LOGIC HELPERS ---
function compStat(g, t) { 
    if (g === t) return 'match-exact'; 
    return g < t ? 'match-none ▲' : 'match-none ▼'; 
}

function compArc(g, t) {
    if (g === t) return 'match-exact';
    // If guessed arc index is lower than target arc index, target is LATER (Up Arrow)
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

// --- END GAME MODAL ---
function triggerEnd(win) {
    playLaugh(win);
    
    document.getElementById('end-title').innerText = win ? "GO BEYOND! PLUS ULTRA!" : "DEFEATED BY VILLAINS!";
    document.getElementById('end-title').style.color = win ? "#22d3ee" : "#ef4444";
    document.getElementById('end-subtitle').innerText = win ? `You recognized ${targetChar.name}.` : `The Hero was ${targetChar.name}.`;

    let modalImg = document.getElementById('end-modal-img');
    if (!modalImg) {
        modalImg = document.createElement('img');
        modalImg.id = 'end-modal-img';
        modalImg.style.cssText = "width: 140px; height: 140px; border-radius: 20px; object-fit: cover; margin: 0 auto 15px; border: 4px solid white; display: block; box-shadow: 0 10px 25px rgba(0,0,0,0.2);";
        document.getElementById('end-title').after(modalImg);
    }
    modalImg.src = targetChar.imageUrl;

    const profileContainer = document.getElementById('modal-profile');
    const stats = [
        { l: 'Gender', v: targetChar.Gender }, { l: 'Quirk', v: targetChar["Quirk Type"] },
        { l: 'Calling', v: targetChar.Calling }, { l: 'Group', v: targetChar.Affiliation },
        { l: 'Height', v: targetChar.Height + 'cm' }, { l: 'Debut', v: targetChar.Debut }
    ];

    profileContainer.innerHTML = stats.map(s => `
        <div class="modal-stat-box" style="background: rgba(0,0,0,0.05); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(0,0,0,0.1);">
            <span style="font-size: 8px; font-weight: 800; color: rgba(0,0,0,0.5); text-transform: uppercase; margin-bottom: 2px;">${s.l}</span>
            <span style="font-size: 11px; font-weight: 700; color: #000; text-transform: uppercase;">${s.v}</span>
        </div>
    `).join('');

    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    setTimeout(() => { overlay.classList.add('opacity-100'); }, 50);
}
