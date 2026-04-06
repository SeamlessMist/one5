let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
const MAX_GUESSES = 10;
let filteredNames = [];

// --- FAIRY TAIL ARC ORDER (Update this list if your JSON uses different Arc Names!) ---
const arcOrder = [
    "Macao Arc", "Daybreak Arc", "Lullaby Arc", "Galuna Island Arc", "Phantom Lord Arc", "Loke Arc",
    "Tower of Heaven Arc", "Battle of Fairy Tail Arc", "Oración Seis Arc", "Daphne Arc", 
    "Edolas Arc", "Tenrou Island Arc", "X791 Arc", "Key of the Starry Sky Arc", "Grand Magic Games Arc", 
    "Eclipse Celestial Spirits Arc", "Sun Village Arc", "Tartaros Arc", "Avatar Arc", "Alvarez Empire Arc", "100 Years Quest Arc"
];

// --- AUDIO ---
const winSound = new Audio('fairytail_win.mp3');
const loseSound = new Audio('fairytail_lose.mp3');

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
    
    // CLOSE BUTTON ON MODAL
    document.getElementById('btn-close-modal').onclick = () => {
        document.getElementById('end-overlay').classList.add('hidden');
        document.getElementById('end-overlay').classList.remove('flex', 'opacity-100');
    };

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
        <div class="w-full grid grid-cols-12 gap-2 mb-1 px-2 text-center text-white/40 text-[9px] font-black uppercase tracking-[0.1em]">
            <div>Character</div><div>Gender</div><div>Age</div><div>Species</div><div>Origin</div>
            <div>Affiliation</div><div>Guild Rank</div><div>Magic Class</div><div>Magic Attr.</div>
            <div>Magic Name</div><div>Height</div><div>Debut</div>
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
                div.innerHTML = `<img src="${c.image || 'placeholder.png'}"><span>${c.name}</span>`;
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
    row.className = 'w-full grid grid-cols-12 gap-2 px-2';
    const isT = g.name === targetChar.name;

    row.innerHTML = [
        `<div class="tile img-tile ${isT ? 'match-exact' : 'match-none'} flip-in"><img src="${g.image || 'placeholder.png'}"></div>`,
        getTileHTML(g.gender, g.gender === targetChar.gender ? 'match-exact' : 'match-none'),
        getTileHTML(g.age, compNum(g.age, targetChar.age)),
        getTileHTML(g.species, g.species === targetChar.species ? 'match-exact' : 'match-none'),
        getTileHTML(g.origin, g.origin === targetChar.origin ? 'match-exact' : 'match-none'),
        getTileHTML(formatArray(g.affiliation), compArray(g.affiliation, targetChar.affiliation)),
        getTileHTML(formatArray(g.guildRank), compArray(g.guildRank, targetChar.guildRank)),
        getTileHTML(formatArray(g.magicClass), compArray(g.magicClass, targetChar.magicClass)),
        getTileHTML(formatArray(g.magicAttribute), compArray(g.magicAttribute, targetChar.magicAttribute)),
        getTileHTML(formatArray(g.magicName), compArray(g.magicName, targetChar.magicName)),
        getTileHTML(g.height, compNum(g.height, targetChar.height)),
        getTileHTML(g.debut, compArc(g.debut, targetChar.debut))
    ].join('');

    board.insertBefore(row, board.children[1]);
    row.querySelectorAll('.flip-in').forEach((t, i) => t.style.animationDelay = `${i * 0.05}s`);
}

// --- LOGIC HELPERS ---

// Universal Array Matcher (For Magic, Affiliation, Guild Rank)
function compArray(g, t) {
    if (!g || !t) return 'match-none';
    if (!Array.isArray(g)) g = [g];
    if (!Array.isArray(t)) t = [t];
    
    const matchesAll = g.length === t.length && g.every(item => t.includes(item));
    if (matchesAll) return 'match-exact';
    if (g.some(item => t.includes(item))) return 'match-partial'; 
    return 'match-none';
}

function formatArray(arr) { 
    if (!arr || arr.length === 0 || arr[0] === "None") return "NONE"; 
    return Array.isArray(arr) ? arr.join('/') : arr; 
}

// Universal Number Comparer (For Age and Height, handles "Unknown")
function compNum(g, t) {
    if (g === t) return 'match-exact';
    let gNum = parseFloat(g.toString().replace(/[^0-9.]/g, ''));
    let tNum = parseFloat(t.toString().replace(/[^0-9.]/g, ''));
    
    if (isNaN(gNum) || isNaN(tNum)) return 'match-none'; // Fallback if "Unknown"
    return gNum < tNum ? 'match-none ▲' : 'match-none ▼';
}

function compArc(g, t) {
    if (g === t) return 'match-exact';
    return arcOrder.indexOf(g) < arcOrder.indexOf(t) ? 'match-none ▲' : 'match-none ▼';
}

function updateCounter() { document.getElementById('guess-counter').innerText = MAX_GUESSES - guesses; }

function getTileHTML(val, type) {
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    // Making text slightly smaller if the string is very long (like multiple magic types)
    const textSize = val.length > 15 ? 'text-[8px]' : '';
    return `<div class="tile ${type.split(' ')[0]} ${textSize} flip-in">${val || 'N/A'}${arrow}</div>`;
}

// --- END GAME MODAL ---
function triggerEnd(win) {
    const sound = win ? winSound : loseSound;
    sound.currentTime = 0;
    sound.play().catch(() => {});

    const title = document.getElementById('end-title');
    const subtitle = document.getElementById('end-subtitle');

    title.innerText = win ? "GUILD QUEST COMPLETE!" : "REQUEST FAILED!";
    title.style.color = win ? "#fde047" : "#ef4444";
    subtitle.innerText = win ? `You identified ${targetChar.name} in ${guesses} guesses.` : `The answer was ${targetChar.name}.`;
    
    let modalImg = document.getElementById('end-modal-img');
    if (!modalImg) {
        modalImg = document.createElement('img');
        modalImg.id = 'end-modal-img';
        document.getElementById('end-title').insertAdjacentElement('beforebegin', modalImg);
    }
    modalImg.src = targetChar.image || 'placeholder.png';

    const profile = document.getElementById('modal-profile');
    const stats = [
        {l:'Gender', v:targetChar.gender}, {l:'Age', v:targetChar.age},
        {l:'Species', v:targetChar.species}, {l:'Origin', v:targetChar.origin},
        {l:'Affiliation', v:formatArray(targetChar.affiliation)}, {l:'Guild Rank', v:formatArray(targetChar.guildRank)},
        {l:'Magic Class', v:formatArray(targetChar.magicClass)}, {l:'Magic Attr.', v:formatArray(targetChar.magicAttribute)},
        {l:'Height', v:targetChar.height}, {l:'Debut', v:targetChar.debut}
    ];
    // Changed grid from 3 to 2 for better readability of arrays
    profile.style.gridTemplateColumns = "repeat(2, 1fr)";
    profile.innerHTML = stats.map(s => `<div class="modal-stat-box"><span class="modal-stat-label">${s.l}</span><span class="modal-stat-value">${s.v || 'N/A'}</span></div>`).join('');

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
