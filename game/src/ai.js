// The Duskkeeper's brain: simple enough to read, sharp enough to punish a
// careless turn. It favours one suit each turn and tells you which, so its
// choices can be read and countered: a Flame turn means damage is coming,
// a Tide turn means it will mend itself, a Grove turn means shields.
// Inside a turn it plays the card with the best value for its cost, and
// weighs healing and shields more when its own lanterns run low.

import { cardById, MAX_LIFE } from './cards.js';
import { SUITS } from './cards.js';

export function foeFavouredSuit(foe) {
  const counts = { flame: 0, tide: 0, grove: 0 };
  for (const id of foe.hand) counts[cardById(id).suit] += 1;
  let best = 'flame';
  for (const suit of ['flame', 'tide', 'grove']) {
    if (counts[suit] > counts[best]) best = suit;
  }
  return { id: best, ...SUITS[best] };
}

function cardValue(state, card) {
  const foe = state.foe;
  const player = state.player;
  const hurt = (MAX_LIFE - foe.life) / MAX_LIFE;
  const threat = (MAX_LIFE - player.life) / MAX_LIFE;
  let value = 0;
  if (card.dmg) value += card.dmg * (1 + threat);
  if (card.heal) value += card.heal * (0.5 + hurt);
  if (card.shield) value += card.shield * (0.5 + hurt);
  if (card.draw) value += 2;
  if (card.wicks) value += card.wicks * 1.5;
  if (card.hits) value += card.dmg * 0.6;
  if (state.suitsPlayed.includes(card.suit)) value += 1.5;
  return value / Math.max(1, card.cost);
}

export function chooseFoeCard(state) {
  const foe = state.foe;
  let best = null;
  let bestValue = 0;
  for (const id of foe.hand) {
    const card = cardById(id);
    if (card.cost > foe.wicks) continue;
    let value = cardValue(state, card);
    // It leans into the suit it announced, so its turn reads as one plan.
    if (state.aiIntent && card.suit === state.aiIntent.id) value += 0.8;
    if (value > bestValue) {
      bestValue = value;
      best = card;
    }
  }
  return best;
}
