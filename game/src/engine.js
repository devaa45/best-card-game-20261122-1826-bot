// The rules of Lantern Court, with no DOM in sight: a plain state object,
// plus the functions that move it. The renderer calls these and redraws.
//
// A duel: each side keeps 20 lanterns of life. On your turn you draw up to
// five cards, gain 3 wicks of energy, and play cards by spending wicks.
// The Duskkeeper then takes its turn the same way. A card's suit matters
// beyond its effect: the second card of a suit you play in one turn, and
// every one after it, resonates and gains +2 to its damage, healing and
// shield. So a hand is a decision about which suit to commit to.

import { buildDeck, cardById, HAND_SIZE, MAX_LIFE, MAX_WICKS } from './cards.js';
import { mulberry32 } from './rng.js';
import { chooseFoeCard, foeFavouredSuit } from './ai.js';

export const RESONANCE_BONUS = 2;
export const WICKS_PER_TURN = 3;

function freshSide(deck) {
  return { life: MAX_LIFE, shield: 0, wicks: 0, hand: [], deck, discard: [] };
}

export function newGame(seed) {
  const rand = mulberry32(seed);
  const state = {
    seed,
    rand,
    turn: 1,
    phase: 'player',
    player: freshSide(buildDeck(rand)),
    foe: freshSide(buildDeck(rand)),
    suitsPlayed: [],
    log: [],
    aiIntent: null,
    lastPlay: null,
    stats: { played: 0, turns: 1, damageDealt: 0 },
  };
  drawUpTo(state.player, HAND_SIZE, state);
  drawUpTo(state.foe, HAND_SIZE, state);
  state.player.wicks = WICKS_PER_TURN;
  state.foe.wicks = WICKS_PER_TURN;
  say(state, 'The court is lit. Your move, Keeper.');
  return state;
}

export function say(state, line) {
  state.log.unshift(line);
  if (state.log.length > 5) state.log.length = 5;
}

export function drawUpTo(side, count, state) {
  while (side.hand.length < count) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = side.discard;
      side.discard = [];
      for (let i = side.deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(state.rand() * (i + 1));
        const tmp = side.deck[i];
        side.deck[i] = side.deck[j];
        side.deck[j] = tmp;
      }
      say(state, 'The deck runs out and the discards are shuffled back in.');
    }
    side.hand.push(side.deck.pop());
  }
}

// How much a card does once resonance is counted. The bonus lands on every
// number the card carries, so a resonating heal or shield is worth as much
// as a resonating hit.
export function boosted(card, state) {
  const resonant = state.suitsPlayed.includes(card.suit);
  const bonus = resonant ? RESONANCE_BONUS : 0;
  const out = { ...card, resonant, bonus };
  if (card.dmg) out.dmg = card.dmg + bonus;
  if (card.heal) out.heal = card.heal + bonus;
  if (card.shield) out.shield = card.shield + bonus;
  return out;
}

export function canPlay(state, card) {
  return state.phase === 'player' && state.player.wicks >= card.cost;
}

function soakDamage(side, amount) {
  const soaked = Math.min(side.shield, amount);
  side.shield -= soaked;
  const through = amount - soaked;
  side.life = Math.max(0, side.life - through);
  return { soaked, through };
}

export function playCard(state, handIndex) {
  if (state.phase !== 'player') return null;
  const id = state.player.hand[handIndex];
  if (id === undefined) return null;
  const card = cardById(id);
  if (state.player.wicks < card.cost) return null;
  return resolveCard(state, state.player, state.foe, card, true);
}

export function resolveCard(state, self, other, card, byPlayer) {
  const played = boosted(card, state);
  self.wicks -= card.cost;
  const at = self.hand.indexOf(card.id);
  if (at >= 0) self.hand.splice(at, 1);
  self.discard.push(card.id);
  state.suitsPlayed.push(card.suit);
  state.lastPlay = { card: played, byPlayer, at: Date.now() };
  state.stats.played += 1;

  const who = byPlayer ? 'You' : 'The Duskkeeper';
  const parts = [];
  if (played.hits) {
    let total = 0;
    for (let h = 0; h < played.hits; h += 1) {
      const hit = soakDamage(other, played.dmg);
      total += hit.through;
    }
    parts.push(`${who} strike ${played.hits} times for ${total} damage`);
    if (byPlayer) state.stats.damageDealt += total;
  } else if (played.dmg) {
    const hit = soakDamage(other, played.dmg);
    parts.push(`${who} deal ${hit.through} damage${hit.soaked ? ` (${hit.soaked} soaked)` : ''}`);
    if (byPlayer) state.stats.damageDealt += hit.through;
  }
  if (played.heal) {
    const before = self.life;
    self.life = Math.min(MAX_LIFE, self.life + played.heal);
    parts.push(`mend ${self.life - before} lanterns`);
  }
  if (played.shield) {
    self.shield += played.shield;
    parts.push(`raise a ${played.shield} shield`);
  }
  if (played.draw) {
    drawUpTo(self, self.hand.length + played.draw, state);
    parts.push(`draw ${played.draw}`);
  }
  if (played.wicks) {
    self.wicks = Math.min(MAX_WICKS, self.wicks + played.wicks);
    parts.push(`gain ${played.wicks} wicks`);
  }
  say(state, `${played.resonant ? 'Resonance! ' : ''}${played.name}: ${parts.join(', ')}.`);
  checkEnd(state);
  return played;
}

export function checkEnd(state) {
  if (state.foe.life <= 0 && state.phase !== 'won') {
    state.phase = 'won';
    say(state, 'The last Duskkeeper lantern goes dark. The court is yours.');
  } else if (state.player.life <= 0 && state.phase !== 'lost') {
    state.phase = 'lost';
    say(state, 'Your last lantern goes dark. The Duskkeeper keeps the court.');
  }
}

// The player's turn ends: the Duskkeeper reveals which suit it favours,
// plays its cards one at a time, and the next player turn begins.
export function endPlayerTurn(state, onStep, onDone) {
  if (state.phase !== 'player') return;
  state.phase = 'ai';
  state.suitsPlayed = [];
  state.aiIntent = foeFavouredSuit(state.foe);
  say(state, `The Duskkeeper gathers ${state.aiIntent.name}…`);
  onStep();
  const step = () => {
    if (state.phase !== 'ai') return;
    const pick = chooseFoeCard(state);
    if (!pick) {
      startPlayerTurn(state);
      onDone();
      return;
    }
    resolveCard(state, state.foe, state.player, pick, false);
    onStep();
    if (state.phase === 'won' || state.phase === 'lost') {
      onDone();
      return;
    }
    setTimeout(step, 650);
  };
  setTimeout(step, 750);
}

export function startPlayerTurn(state) {
  if (state.phase === 'lost' || state.phase === 'won') return;
  state.turn += 1;
  state.stats.turns = state.turn;
  state.phase = 'player';
  state.suitsPlayed = [];
  state.player.wicks = Math.min(MAX_WICKS, state.player.wicks + WICKS_PER_TURN);
  state.foe.wicks = Math.min(MAX_WICKS, state.foe.wicks + WICKS_PER_TURN);
  drawUpTo(state.player, HAND_SIZE, state);
  drawUpTo(state.foe, HAND_SIZE, state);
  say(state, `Turn ${state.turn}. You draw up and gain ${WICKS_PER_TURN} wicks.`);
}
