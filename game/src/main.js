// Bootstrap: wires the buttons and keys, starts games, and stages the four
// screenshot states the maker photographs. ?shot=title shows the title
// screen, ?shot=table a mid-game table with a fixed seed, ?shot=win and
// ?shot=loss the two end screens over a finished table. A plain open with
// no query shows the title screen and plays normally.

import { newGame, playCard, endPlayerTurn, startPlayerTurn } from './engine.js';
import { cardById, SUITS } from './cards.js';
import { renderAll, floatText, showPlayedCard, shakeTable } from './render.js';
import { clickSound, playSound, hitSound, healSound, winSound, loseSound, unlockAudio, toggleMute, isMuted } from './sound.js';

let state = null;

function rerender() {
  renderAll(state, { onPlay: onCardClicked });
}

function onCardClicked(index) {
  if (!state || state.phase !== 'player') return;
  const card = cardById(state.player.hand[index]);
  if (!card || state.player.wicks < card.cost) return;
  unlockAudio();
  const played = playCard(state, index);
  if (!played) return;
  showPlayedCard(played);
  playSound();
  if (played.dmg) {
    floatText(`-${played.dmg * (played.hits || 1)}`, 'dmg');
    hitSound();
    if (played.dmg >= 9) shakeTable();
  }
  if (played.heal) {
    floatText(`+${played.heal}`, 'heal');
    healSound();
  }
  rerender();
  if (state.phase === 'won') winSound();
  if (state.phase === 'lost') loseSound();
}

function onEndTurn() {
  if (!state || state.phase !== 'player') return;
  unlockAudio();
  clickSound();
  endPlayerTurn(state, rerender, rerender);
}

function startFresh(seed) {
  state = newGame(seed);
  document.getElementById('screen-title').classList.add('hidden');
  rerender();
}

// A fixed mid-game table for the photograph: turn 4, both sides bloodied,
// a hand with a real choice in it, and the Duskkeeper's intent showing.
function stageTable(seed) {
  state = newGame(seed);
  state.turn = 4;
  state.stats.turns = 4;
  state.player.life = 14;
  state.player.shield = 5;
  state.player.wicks = 6;
  state.foe.life = 17;
  state.foe.shield = 0;
  state.foe.wicks = 4;
  state.player.hand = ['torch-bearer', 'wildfire', 'still-pool', 'seedling', 'bramble-lash'];
  state.foe.hand = ['cinder-imp', 'fog-veil', 'thorn-wall', 'undertow', 'moon-tide'];
  state.aiIntent = { id: 'flame', ...SUITS.flame };
  state.phase = 'player';
  state.log = [
    'Resonance! Torch Bearer: You deal 7 damage.',
    'The Duskkeeper gathers Flame…',
    'Turn 4. You draw up and gain 3 wicks.',
  ];
  document.getElementById('screen-title').classList.add('hidden');
  renderAll(state, { onPlay: onCardClicked });
}

function stageEnd(won) {
  stageTable(7);
  if (won) {
    state.foe.life = 0;
    state.phase = 'won';
    state.stats = { played: 11, turns: 6, damageDealt: 34 };
  } else {
    state.player.life = 0;
    state.phase = 'lost';
    state.stats = { played: 9, turns: 5, damageDealt: 21 };
  }
  renderAll(state, { onPlay: onCardClicked });
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '7');

  document.getElementById('start-btn').addEventListener('click', () => {
    unlockAudio();
    clickSound();
    startFresh((Math.random() * 1e9) | 0);
  });
  document.getElementById('end-turn').addEventListener('click', onEndTurn);
  document.getElementById('again-btn').addEventListener('click', () => {
    clickSound();
    startFresh((Math.random() * 1e9) | 0);
  });
  document.getElementById('mute-btn').addEventListener('click', (e) => {
    const muted = toggleMute();
    e.currentTarget.textContent = muted ? '🔇 Muted' : '🔊 Sound';
  });
  document.getElementById('how-btn').addEventListener('click', () => {
    document.getElementById('howto').classList.toggle('hidden');
  });

  window.addEventListener('keydown', (e) => {
    if (!state) return;
    if (e.key >= '1' && e.key <= '5') onCardClicked(Number(e.key) - 1);
    if (e.key === ' ' || e.key === 'Enter') {
      if (state.phase === 'player') {
        e.preventDefault();
        onEndTurn();
      }
    }
    if (e.key === 'm' || e.key === 'M') {
      const muted = toggleMute();
      document.getElementById('mute-btn').textContent = muted ? '🔇 Muted' : '🔊 Sound';
    }
    if ((e.key === 'r' || e.key === 'R') && (state.phase === 'won' || state.phase === 'lost')) {
      startFresh((Math.random() * 1e9) | 0);
    }
  });

  if (shot === 'table') stageTable(seed);
  else if (shot === 'win') stageEnd(true);
  else if (shot === 'loss') stageEnd(false);
  else {
    state = newGame(seed);
    state.phase = 'title';
    renderAll(state, { onPlay: onCardClicked });
  }
}

init();
