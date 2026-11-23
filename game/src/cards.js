// The card catalogue for Lantern Court. Every card belongs to one of three
// suits, and each suit is told apart by colour and shape, never by text alone:
// Flame is red with a triangle, Tide is blue with a circle, Grove is green
// with a diamond. A card's numbers are its whole effect: damage hurts the
// other side, heal restores your own lanterns, shield soaks damage, draw
// pulls a card, wicks add energy, hits repeats the damage that many times.

export const SUITS = {
  flame: { name: 'Flame', color: '#e8533f', mark: '▲' },
  tide: { name: 'Tide', color: '#3f8fe8', mark: '●' },
  grove: { name: 'Grove', color: '#58b368', mark: '◆' },
};

export const CARDS = [
  { id: 'cinder-imp', name: 'Cinder Imp', suit: 'flame', cost: 1, dmg: 3, text: 'Deal 3 damage.' },
  { id: 'torch-bearer', name: 'Torch Bearer', suit: 'flame', cost: 2, dmg: 5, text: 'Deal 5 damage.' },
  { id: 'wildfire', name: 'Wildfire', suit: 'flame', cost: 4, dmg: 9, text: 'Deal 9 damage.' },
  { id: 'spark-thief', name: 'Spark Thief', suit: 'flame', cost: 2, dmg: 3, draw: 1, text: 'Deal 3 damage. Draw a card.' },
  { id: 'twin-sparks', name: 'Twin Sparks', suit: 'flame', cost: 3, dmg: 3, hits: 2, text: 'Deal 3 damage, twice.' },
  { id: 'lantern-swap', name: 'Lantern Swap', suit: 'flame', cost: 2, dmg: 4, heal: 4, text: 'Deal 4 damage. Mend 4 lanterns.' },
  { id: 'still-pool', name: 'Still Pool', suit: 'tide', cost: 1, heal: 4, text: 'Mend 4 lanterns.' },
  { id: 'moon-tide', name: 'Moon Tide', suit: 'tide', cost: 2, heal: 6, draw: 1, text: 'Mend 6 lanterns. Draw a card.' },
  { id: 'undertow', name: 'Undertow', suit: 'tide', cost: 3, dmg: 4, heal: 3, text: 'Deal 4 damage. Mend 3 lanterns.' },
  { id: 'fog-veil', name: 'Fog Veil', suit: 'tide', cost: 2, shield: 6, text: 'Raise a 6 shield.' },
  { id: 'thorn-wall', name: 'Thorn Wall', suit: 'grove', cost: 1, shield: 5, text: 'Raise a 5 shield.' },
  { id: 'root-snare', name: 'Root Snare', suit: 'grove', cost: 2, shield: 8, dmg: 2, text: 'Raise an 8 shield. Deal 2 damage.' },
  { id: 'seedling', name: 'Seedling', suit: 'grove', cost: 1, wicks: 2, text: 'Gain 2 wicks.' },
  { id: 'overgrowth', name: 'Overgrowth', suit: 'grove', cost: 3, shield: 10, text: 'Raise a 10 shield.' },
  { id: 'bramble-lash', name: 'Bramble Lash', suit: 'grove', cost: 2, dmg: 4, shield: 4, text: 'Deal 4 damage. Raise a 4 shield.' },
];

export const MAX_LIFE = 20;
export const MAX_WICKS = 10;
export const HAND_SIZE = 5;

// Two copies of every card make a 30-card deck, shuffled with the given rand.
export function buildDeck(rand) {
  const deck = [];
  for (const card of CARDS) {
    deck.push(card.id, card.id);
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}
