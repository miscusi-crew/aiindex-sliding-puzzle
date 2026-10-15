"use strict";
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: works until reload */ }
}

const $ = (id) => document.getElementById(id);
let n, tiles, moves, startedAt, timer, solved;

/** Shuffles with random legal moves, so the puzzle is always solvable. */
function newGame() {
  n = Number($("size").value);
  tiles = [...Array(n * n).keys()].map((i) => (i + 1) % (n * n));
  let gap = n * n - 1, prev = -1;
  for (let k = 0; k < n * n * 40; k++) {
    const opts = neighbours(gap).filter((j) => j !== prev);
    const j = opts[Math.floor(Math.random() * opts.length)];
    [tiles[gap], tiles[j]] = [tiles[j], tiles[gap]];
    prev = gap;
    gap = j;
  }
  if (isSolved()) return newGame();
  moves = 0;
  solved = false;
  startedAt = null;
  clearInterval(timer);
  $("time").textContent = "0";
  $("msg").textContent = "";
  $("best").textContent = load(`slide-best-${n}`, "–");
  $("board").style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  render();
}

function neighbours(i) {
  const r = Math.floor(i / n), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}
const isSolved = () => tiles.every((t, i) => t === (i + 1) % (n * n));

function slide(i) {
  if (solved) return;
  const gap = tiles.indexOf(0);
  if (!neighbours(gap).includes(i)) return;
  [tiles[gap], tiles[i]] = [tiles[i], tiles[gap]];
  moves++;
  if (!startedAt) {
    startedAt = Date.now();
    timer = setInterval(() => { $("time").textContent = Math.floor((Date.now() - startedAt) / 1000); }, 250);
  }
  if (isSolved()) {
    solved = true;
    clearInterval(timer);
    const best = load(`slide-best-${n}`, null);
    if (best === null || moves < best) save(`slide-best-${n}`, moves);
    $("best").textContent = load(`slide-best-${n}`, "–");
    $("msg").textContent = `Solved in ${moves} moves!`;
  }
  render();
}

function render() {
  $("board").innerHTML = tiles.map((t, i) =>
    `<button data-i="${i}" class="${t === 0 ? "empty" : t === i + 1 ? "home" : ""}" ${t === 0 ? 'aria-hidden="true" tabindex="-1"' : ""}>${t || ""}</button>`).join("");
  $("moves").textContent = moves;
}

$("board").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) slide(Number(b.dataset.i));
});
document.addEventListener("keydown", (e) => {
  const gap = tiles.indexOf(0);
  // The arrow moves the tile on that side of the gap into it.
  const from = { ArrowLeft: gap + 1, ArrowRight: gap - 1, ArrowUp: gap + n, ArrowDown: gap - n }[e.key];
  if (from === undefined) return;
  e.preventDefault();
  if (from >= 0 && from < n * n && neighbours(gap).includes(from)) slide(from);
});
$("new").addEventListener("click", newGame);
$("size").addEventListener("change", newGame);
newGame();
