/* ============================================================
   MERGES - a series that was folded into another.

   Episode progress is stored per universe, so when two universes
   become one the old keys have to move. store.js reads this and
   migrates them once. Written by `npm run series merge`.
   ============================================================ */

window.MERGES = {
  "bettercallsaul": "breakingbad",
  "supernaturaltheanimeseri": "supernatural",
  "berlin": "moneyheist"
};
