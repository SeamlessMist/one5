let characters = [];
let targetChar = null;
let mode = 'daily';
let guesses = 0;
let filteredNames = [];

const winSound = new Audio('luffy.mp3');
const loseSound = new Audio('doffy.mp3');

document.addEventListener('pointerdown', () => {
    winSound.play().then(() => winSound.pause());
    loseSound.play().then(() => loseSound.pause()); 
}, { once: true });

const arcOrder = ["Romance Dawn", "Orange Town", "Syrup Village", "Baratie", "Arlong Park", "Loguetown", "Reverse Mountain", "Whiskey Peak", "Little Garden", "Drum Island", "Alabasta", "Jaya", "Skypiea", "Long Ring Long Land", "Water 7", "Enies Lobby", "Thriller Bark", "Sabaody Archipelago", "Amazon Lily", "Impel Down", "Marineford", "Fish-Man Island", "Punk Hazard", "Dressrosa", "Zou", "Whole Cake Island", "Reverie", "Wano", "Egghead"];

window.onload = async () => {
    try {
        const res = await fetch('./characters.json');
        if (!res.ok) throw new Error("Fetch failed");
        characters = await res.json();
        initUI();
    } catch (e) { console.error("Could not load characters.json"); }
};

function initUI() {
    document.getElementById('btn-daily').onclick = () => setMode('daily');
    document.getElementById('btn-unlimited').onclick = () => setMode('unlimited');
    document.getElementById('btn-play-again').onclick = () => resetGame();
    setupSearch();
    setMode('daily');
}

function setMode(m) {
    mode = m;
    const pill = document.getElementById('mode-pill');
    if(m === 'daily') {
        pill.style.transform = 'translateX(0)';
        document.getElementById('btn-daily').classList.add('mode-active');
        document.getElementById('btn-unlimited').classList.remove('mode-active');
    } else {
        pill.style.transform = 'translateX(100%)';
        document.getElementById('btn-unlimited').classList.add('mode-active');
        document.getElementById('btn-daily').classList.remove('mode-active');
    }
    resetGame();
}

function resetGame() {
    guesses = 0;
    document.getElementById('guesses-left-text').innerText = `10 / 10`;
    const board = document.getElementById('game-board');
    const header = board.querySelector('.category-row');
    board.innerHTML = ''; board.appendChild(header);
    document.getElementById('end-overlay').classList.add('hidden');
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
    const list = document.getElementById('autocomplete-list');
    input.oninput = () => {
        const val = input.value.toLowerCase().trim();
        list.innerHTML = '';
        if(!val) { list.classList.add('hidden'); return; }
        const matches = characters.filter(c => c.name.toLowerCase().includes(val) && filteredNames.includes(c.name));
        if(matches.length) {
            list.classList.remove('hidden');
            matches.slice(0, 10).forEach(m => {
                const d = document.createElement('div');
                d.className = 'search-item';
                d.innerHTML = `<img src="${m.image}" style="width:30px;height:30px;border-radius:4px"> ${m.name}`;
                d.onclick = () => { input.value = m.name; list.classList.add('hidden'); submitGuess(); };
                list.appendChild(d);
            });
        }
    };
}

function submitGuess() {
    const name = document.getElementById('guess-input').value;
    const char = characters.find(c => c.name === name);
    if(!char || !filteredNames.includes(name)) return;
    document.getElementById('guess-input').value = '';
    filteredNames = filteredNames.filter(n => n !== name);
    guesses++;
    document.getElementById('guesses-left-text').innerText = `${10 - guesses} / 10`;
    renderRow(char);
    if(char.name === targetChar.name) endGame(true);
    else if(guesses >= 10) endGame(false);
}

function renderRow(g) {
    const board = document.getElementById('game-board');
    const row = document.createElement('div');
    row.className = 'w-full grid grid-cols-11 gap-2 px-2 mb-2';
    
    const isT = g.name === targetChar.name;
    const getArrow = (gu, ta) => gu === ta ? '' : (gu < ta ? ' ▲' : ' ▼');
    const parseB = (b) => parseInt(b.toString().replace(/[^0-9]/g, '')) || 0;

    row.innerHTML = [
        `<div class="tile ${isT ? 'match-exact' : 'match-none'} p-0"><img src="${g.image}"></div>`,
        `<div class="tile ${g.gender === targetChar.gender ? 'match-exact' : 'match-none'}">${g.gender}</div>`,
        `<div class="tile ${g.species === targetChar.species ? 'match-exact' : 'match-none'}">${g.species}</div>`,
        `<div class="tile ${g.calling === targetChar.calling ? 'match-exact' : 'match-none'}">${g.calling}</div>`,
        `<div class="tile ${g.affiliation === targetChar.affiliation ? 'match-exact' : 'match-none'}">${g.affiliation}</div>`,
        `<div class="tile ${g.devilFruitType === targetChar.devilFruitType ? 'match-exact' : 'match-none'}">${g.devilFruitType}</div>`,
        `<div class="tile ${JSON.stringify(g.haki) === JSON.stringify(targetChar.haki) ? 'match-exact' : (g.haki.some(x => targetChar.haki.includes(x)) ? 'match-partial' : 'match-none')}">${g.haki.map(x => x.substring(0,3)).join('/').toUpperCase()}</div>`,
        `<div class="tile ${g.heightCm === targetChar.heightCm ? 'match-exact' : 'match-none'}">${g.heightCm}cm${getArrow(g.heightCm, targetChar.heightCm)}</div>`,
        `<div class="tile ${parseB(g.bounty) === parseB(targetChar.bounty) ? 'match-exact' : 'match-none'}">${g.bounty}${getArrow(parseB(g.bounty), parseB(targetChar.bounty))}</div>`,
        `<div class="tile ${g.seaOfBirth === targetChar.seaOfBirth ? 'match-exact' : 'match-none'}">${g.seaOfBirth}</div>`,
        `<div class="tile ${g.firstArc === targetChar.firstArc ? 'match-exact' : 'match-none'}">${g.firstArc}${getArrow(arcOrder.indexOf(g.firstArc), arcOrder.indexOf(targetChar.firstArc))}</div>`
    ].join('');
    board.insertBefore(row, board.children[1]);
}

function endGame(win) {
    win ? winSound.play() : loseSound.play();
    document.getElementById('end-overlay').classList.remove('hidden');
    document.getElementById('end-overlay').classList.add('flex');
    document.getElementById('card-title').innerText = win ? "DATA SYNCHRONIZED" : "LOST SIGNAL";
    document.getElementById('card-title').style.color = win ? "#00f2ff" : "#ff4444";
    const stats = [{l:'Sex',v:targetChar.gender},{l:'Race',v:targetChar.species},{l:'Role',v:targetChar.calling},{l:'Group',v:targetChar.affiliation},{l:'Fruit',v:targetChar.devilFruitType},{l:'Haki',v:targetChar.haki.join(', ')},{l:'Size',v:targetChar.heightCm+'cm'},{l:'Value',v:targetChar.bounty},{l:'Origin',v:targetChar.seaOfBirth},{l:'Debut',v:targetChar.firstArc}];
    document.getElementById('modal-profile').innerHTML = stats.map(s => `<div class="modal-stat-box"><span class="modal-stat-label">${s.l}</span><span class="modal-stat-value">${s.v}</span></div>`).join('');
    setTimeout(() => document.getElementById('end-overlay').classList.add('opacity-100'), 50);
}
