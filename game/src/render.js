// Everything the player sees, drawn from the engine state. Cards are plain
// DOM, so they stay crisp at any size and readable when a screenshot is
// shrunk to a thumbnail: big cost pips, big suit marks, short effect text.
// Animations are CSS classes: a played card flies to the middle of the
// table, damage numbers float up and fade, the table shakes on a heavy hit.

import { SUITS, cardById } from './cards.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lanternRow(life, shield) {
  const row = el('div', 'life-row');
  const num = el('span', 'life-num', String(life));
  const label = el('span', 'life-label', 'lanterns');
  row.append(num, label);
  if (shield > 0) row.append(el('span', 'shield-badge', `🛡 ${shield}`));
  return row;
}

export function cardNode(card, opts) {
  const node = el('div', 'card');
  if (opts && opts.faceDown) {
    node.classList.add('face-down');
    node.append(el('div', 'card-back', '🏮'));
    return node;
  }
  const suit = SUITS[card.suit];
  node.style.setProperty('--suit', suit.color);
  if (opts && opts.playable === false) node.classList.add('unplayable');
  const head = el('div', 'card-head');
  head.append(el('span', 'cost', String(card.cost)));
  head.append(el('span', 'suit-mark', suit.mark));
  const name = el('div', 'card-name', card.name);
  const suitName = el('div', 'card-suit', suit.name);
  const text = el('div', 'card-text', card.text);
  node.append(head, name, suitName, text);
  if (opts && opts.onPlay) {
    node.addEventListener('click', opts.onPlay);
    node.tabIndex = 0;
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        opts.onPlay();
      }
    });
  }
  return node;
}

function renderSide(root, side, label, isFoe, state, onPlay) {
  root.innerHTML = '';
  const head = el('div', 'side-head');
  head.append(el('span', 'side-name', label));
  head.append(lanternRow(side.life, side.shield));
  if (isFoe) {
    const count = el('span', 'hand-count', `${side.hand.length} cards in hand`);
    head.append(count);
    if (state.aiIntent && state.phase === 'ai') {
      const intent = el('span', 'intent', `Gathers ${state.aiIntent.name} ${state.aiIntent.mark}`);
      intent.style.color = state.aiIntent.color;
      head.append(intent);
    }
  }
  root.append(head);
  const hand = el('div', 'hand');
  if (isFoe) {
    for (let i = 0; i < side.hand.length; i += 1) {
      hand.append(cardNode(null, { faceDown: true }));
    }
  } else {
    side.hand.forEach((id, i) => {
      const card = cardById(id);
      const playable = state.phase === 'player' && side.wicks >= card.cost;
      hand.append(cardNode(card, {
        playable,
        onPlay: playable ? () => onPlay(i) : null,
      }));
    });
  }
  root.append(hand);
}

export function renderAll(state, hooks) {
  const turnLabel = document.getElementById('turn-label');
  turnLabel.textContent = state.phase === 'title'
    ? 'Lantern Court'
    : state.phase === 'player'
      ? `Turn ${state.turn} — your move`
      : state.phase === 'ai'
        ? `Turn ${state.turn} — the Duskkeeper plays…`
        : state.phase === 'won'
          ? 'The court is yours'
          : 'The lanterns go dark';

  const wicks = document.getElementById('wicks');
  wicks.innerHTML = '';
  for (let i = 0; i < 10; i += 1) {
    wicks.append(el('span', i < state.player.wicks ? 'wick on' : 'wick', '●'));
  }
  document.getElementById('deck-count').textContent = `${state.player.deck.length} in deck`;

  renderSide(document.getElementById('foe-side'), state.foe, 'The Duskkeeper', true, state, null);
  renderSide(document.getElementById('player-side'), state.player, 'You — the Lantern Keeper', false, state, hooks.onPlay);

  const log = document.getElementById('log');
  log.innerHTML = '';
  for (const line of state.log) log.append(el('div', 'log-line', line));

  const endBtn = document.getElementById('end-turn');
  endBtn.disabled = state.phase !== 'player';
  document.getElementById('end-screen').classList.toggle('hidden', state.phase !== 'won' && state.phase !== 'lost');
  if (state.phase === 'won' || state.phase === 'lost') {
    document.getElementById('end-title').textContent = state.phase === 'won'
      ? 'The court is yours'
      : 'The lanterns go dark';
    document.getElementById('end-sub').textContent = state.phase === 'won'
      ? 'Every Duskkeeper lantern is out. The light stays with you.'
      : 'The Duskkeeper keeps the court tonight. Light it again.';
    document.getElementById('end-stats').textContent =
      `${state.stats.turns} turns · ${state.stats.played} cards played · ${state.stats.damageDealt} damage dealt`;
  }
}

// A floating number over the table: damage in red, healing in green.
export function floatText(text, kind) {
  const layer = document.getElementById('fx');
  const node = el('span', `float-text ${kind}`, text);
  node.style.left = `${42 + Math.random() * 16}%`;
  layer.append(node);
  setTimeout(() => node.remove(), 1200);
}

// The played card, briefly, in the middle of the table.
export function showPlayedCard(card) {
  const layer = document.getElementById('fx');
  layer.innerHTML = '';
  const node = cardNode(card, {});
  node.classList.add('played-pop');
  layer.append(node);
  setTimeout(() => node.remove(), 900);
}

export function shakeTable() {
  const table = document.getElementById('table');
  table.classList.remove('shake');
  void table.offsetWidth;
  table.classList.add('shake');
}
