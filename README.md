# Lantern Court

A small duel card game that runs entirely from its own files. You are the
Lantern Keeper, and the Duskkeeper across the table wants your light.

## How a duel goes

Each side keeps 20 lanterns of life. On your turn you draw up to five cards
and gain 3 wicks of energy, then you spend wicks to play cards. The
Duskkeeper does the same on its turn. The first side whose lanterns all go
dark loses.

Cards come in three suits, told apart by colour and shape: Flame is red with
a triangle, Tide is blue with a circle, Grove is green with a diamond. A
card either deals damage, mends your lanterns, raises a shield that soaks
damage, draws a card, or gains wicks.

The decision in every hand is resonance. The second card of a suit you play
in one turn, and every one after it, gains +2 to its numbers. A hand that
commits to one suit hits harder than a hand that spreads itself thin.

The Duskkeeper is not silent about its plans. Before it plays, it announces
the suit it gathers, so a Flame turn means damage is coming and a Grove
turn means shields. Read that, and answer in kind.

## Playing it

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). Click a card to play it, or press 1–5. Space ends your turn,
M mutes, R starts a fresh duel after one ends.

The game makes its own sounds with the Web Audio API and loads nothing from
the network. Screenshots live in `screenshots/`; `?shot=title|table|win|loss`
opens the game straight into each photographed state.
