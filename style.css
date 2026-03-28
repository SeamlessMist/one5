/* =========================================
   1. GLOBAL VARIABLES & BACKGROUND
   ========================================= */
:root {
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --color-cyan: #00f2ff;
  --color-green: #4ade80;
  --color-red: #ff4444;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: #050505;
  background-image: linear-gradient(rgba(5, 5, 5, 0.8), rgba(5, 5, 5, 0.9)), url('luffy-bg.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #ffffff;
  font-family: var(--font-sans);
  min-height: 100vh;
}

/* =========================================
   2. FROSTED GLASS UI
   ========================================= */
.glass-ui {
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.glass-dropdown {
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Scrollbar Hiding Utility */
.hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
.hide-scroll::-webkit-scrollbar { display: none; }

/* =========================================
   3. TOGGLE BAR & DROPDOWN LOGIC
   ========================================= */
.mode-active { color: var(--color-cyan) !important; opacity: 1 !important; }

/* Dropdown items with images */
.search-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  text-transform: uppercase;
  transition: background 0.2s ease;
}
.search-item:hover { background: rgba(255, 255, 255, 0.1); }
.search-item img {
  width: 40px; height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* =========================================
   4. GAME TILES & COLORS (TACTICAL THEME)
   ========================================= */
.tile {
  background: rgba(15, 15, 15, 0.9); 
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
  min-height: 105px;
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
  word-break: break-word;
  transition: all 0.3s ease;
}

/* EXACT MATCH (CYAN) */
.tile.match-exact { 
  background: rgba(0, 242, 255, 0.15); 
  border: 1px solid var(--color-cyan); 
  color: var(--color-cyan); 
  box-shadow: inset 0 0 15px rgba(0, 242, 255, 0.1);
}

/* PARTIAL MATCH (GREEN) */
.tile.match-partial { 
  background: rgba(74, 222, 128, 0.15); 
  border: 1px solid var(--color-green); 
  color: var(--color-green);
}

/* WRONG MATCH (RED) */
.tile.match-none { 
  background: rgba(255, 68, 68, 0.1); 
  border: 1px solid rgba(255, 68, 68, 0.4); 
  color: var(--color-red); 
}

/* Image Tile Specifics */
.tile.p-0 { padding: 0 !important; overflow: hidden; }
.tile img { width: 100%; height: 100%; object-fit: cover; }

/* =========================================
   5. END GAME MODAL STATS
   ========================================= */
.modal-stat-box {
  background: rgba(255, 255, 255, 0.03);
  padding: 12px 6px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-stat-label {
  font-family: var(--font-sans);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
  letter-spacing: 0.1em;
}

.modal-stat-value {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-cyan);
  text-transform: uppercase;
  text-align: center;
  line-height: 1.2;
}

/* =========================================
   6. ANIMATIONS
   ========================================= */
.flip-in {
    opacity: 0;
    transform: rotateX(90deg);
    animation: flipIn 0.5s ease-out forwards;
}

@keyframes flipIn {
    0% { transform: rotateX(90deg); opacity: 0; }
    100% { transform: rotateX(0deg); opacity: 1; }
}
