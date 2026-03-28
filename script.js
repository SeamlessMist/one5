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
    winSound.play().then(() => { winSound.pause(); winSound.currentTime = 0; }).catch(()=>{});
    loseSound.play().then(() => { loseSound.pause(); loseSound.currentTime = 0; }).catch(()=>{});
    audioUnlocked = true;
    document.removeEventListener('pointerdown', unlockAudio);
}
document.addEventListener('pointerdown', unlockAudio);

function playLaugh(isWin) {
    if (!audioUnlocked) return;
    const sound = isWin ? winSound : loseSound;
    sound.currentTime = 0;
    sound.play().catch(e => console.warn("Audio file missing or blocked."));
}

window.onload = async () => {
    try {
        const res = await fetch('characters.json');
        characters = await res.json();
        initUI();
        setMode('daily');
    } catch (e) { console.error("JSON missing"); }
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
    document.getElementById('guess-counter').innerText = MAX_GUESSES;
    document.getElementById('game-board').innerHTML = `
        <div class="w-full grid grid-cols-11 gap-2 mb-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider">
            <div>Character</div><div>Gender</div><div>Species</div><div>Calling</div>
            <div>Affiliation</div><div>Fruit</div><div>Haki</div><div>Height</div>
            <div>Bounty</div><div>Origin</div><div>Debut</div>
        </div>`;
    document.getElementById('end-overlay').classList.add('hidden');
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

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        if (!val) { dropdown.classList.add('hidden'); return; }
        const matches = characters.filter(c => c.name.toLowerCase().includes(val) && filteredNames.includes(c.name));
        if (matches.length > 0) {
            dropdown.classList.remove('hidden');
            matches.slice(0, 10).forEach(char => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerHTML = `<img src="${char.image || 'placeholder.png'}"> <span>${char.name}</span>`;
                div.onclick = () => { input.value = char.name; executeGuess(); };
                dropdown.appendChild(div);
            });
        }
    });
}

function executeGuess() {
    const input = document.getElementById('search-input');
    const name = input.value.trim();
    const char = characters.find(c => c.name === name);
    if (!char || !filteredNames.includes(name)) return;

    input.value = '';
    filteredNames = filteredNames.filter(n => n !== name);
    guesses++;
    document.getElementById('guess-counter').innerText = MAX_GUESSES - guesses;
    
    renderRow(char);

    if (char.name === targetChar.name) setTimeout(() => triggerEnd(true), 1000);
    else if (guesses >= MAX_GUESSES) setTimeout(() => triggerEnd(false), 1000);
}

function renderRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 mb-2 px-2';
    
    const isT = g.name === targetChar.name;
    const arcOrder = ["Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown", "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta", "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark", "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island", "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"];

    const compareStat = (gu, ta) => gu === ta ? 'match-exact' : gu < ta ? 'match-none ▲' : 'match-none ▼';
    const compareArc = (gu, ta) => gu === ta ? 'match-exact' : arcOrder.indexOf(gu) < arcOrder.indexOf(ta) ? 'match-none ▲' : 'match-none ▼';
    const parseB = (b) => parseInt(b.toString().replace(/[^0-9]/g, '')) || 0;
    const formatB = (b) => {
        let n = parseB(b);
        if(n>=1e9) return (n/1e9).toFixed(1)+'B';
        if(n>=1e6) return (n/1e6).toFixed(1)+'M';
        return n>0 ? n.toLocaleString() : "NONE";
    };

    const tilesHTML = [
        `<div class="tile tile-portrait ${isT ? 'match-exact' : 'match-none'} flip-in"><img src="${g.image || 'placeholder.png'}"></div>`,
        getTileHTML(g.gender, g.gender === targetChar.gender ? 'match-exact' : 'match-none'),
        getTileHTML(g.species, g.species === targetChar.species ? 'match-exact' : 'match-none'),
        getTileHTML(g.calling, g.calling === targetChar.calling ? 'match-exact' : 'match-none'),
        getTileHTML(g.affiliation, g.affiliation === targetChar.affiliation ? 'match-exact' : 'match-none'),
        getTileHTML(g.devilFruitType, g.devilFruitType === targetChar.devilFruitType ? 'match-exact' : 'match-none'),
        getTileHTML(g.haki.map(x=>x.substring(0,3)).join('/').toUpperCase(), (JSON.stringify(g.haki) === JSON.stringify(targetChar.haki) ? 'match-exact' : (g.haki.some(x=>targetChar.haki.includes(x)) ? 'match-partial' : 'match-none'))),
        getTileHTML(g.heightCm + 'cm', compareStat(g.heightCm, targetChar.heightCm)),
        getTileHTML(formatB(g.bounty), compareStat(parseB(g.bounty), parseB(targetChar.bounty))),
        getTileHTML(g.seaOfBirth, g.seaOfBirth === targetChar.seaOfBirth ? 'match-exact' : 'match-none'),
        getTileHTML(g.firstArc, compareArc(g.firstArc, targetChar.firstArc))
    ].join('');

    row.innerHTML = tilesHTML;
    board.insertBefore(row, board.children[1]);
}

function getTileHTML(val, type) {
    const baseClass = type.split(' ')[0];
    const arrow = type.includes('▲') ? ' ▲' : type.includes('▼') ? ' ▼' : '';
    return `<div class="tile ${baseClass} flip-in">${val}${arrow}</div>`;
}

function triggerEnd(win) {
    playLaugh(win);
    document.getElementById('end-title').innerText = win ? "BOUNTY CLAIMED!" : "WALK THE PLANK!";
    document.getElementById('end-title').style.color = win ? "#a38900" : "#ef4444";
    document.getElementById('end-subtitle').innerText = `The character was ${targetChar.name}.`;

    const profileContainer = document.getElementById('modal-profile');
    const stats = [
        { l: 'Gender', v: targetChar.gender }, { l: 'Species', v: targetChar.species },
        { l: 'Role', v: targetChar.calling }, { l: 'Group', v: targetChar.affiliation },
        { l: 'Fruit', v: targetChar.devilFruitType }, { l: 'Haki', v: targetChar.haki.join(', ') },
        { l: 'Height', v: targetChar.heightCm + 'cm' }, { l: 'Bounty', v: targetChar.bounty },
        { l: 'Origin', v: targetChar.seaOfBirth }, { l: 'Debut', v: targetChar.firstArc }
    ];

    profileContainer.innerHTML = stats.map(s => `
        <div class="modal-stat-box">
            <span class="modal-stat-label">${s.l}</span>
            <span class="modal-stat-value">${s.v}</span>
        </div>
    `).join('');

    // Inject Character Image into Modal Header
    const titleNode = document.getElementById('end-title');
    if (!document.querySelector('.modal-portrait')) {
        const img = document.createElement('img');
        img.className = 'modal-portrait';
        img.src = targetChar.image || 'placeholder.png';
        titleNode.after(img);
    } else {
        document.querySelector('.modal-portrait').src = targetChar.image || 'placeholder.png';
    }

    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    setTimeout(() => { overlay.classList.add('opacity-100'); }, 50);
}
