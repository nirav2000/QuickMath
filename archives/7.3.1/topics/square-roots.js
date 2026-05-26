export const squareRootsTopic = {
  id: 'square-roots',
  label: 'Square Roots',
  caption: 'Square roots with progression + spaced repetition',
  tips: [
    `<div class="anchor-grid">
      <div><strong>1²–5²</strong><span>1, 4, 9, 16, 25</span></div>
      <div><strong>6²–10²</strong><span>36, 49, 64, 81, 100</span></div>
      <div><strong>11²–15²</strong><span>121, 144, 169, 196, 225</span></div>
      <div><strong>16²–20²</strong><span>256, 289, 324, 361, 400</span></div>
      <div><strong>21²–25²</strong><span>441, 484, 529, 576, 625</span></div>
    </div>`,
    'Bracket number between perfect squares.',
    'Estimate ratio within interval.',
    'Use last-digit clues for perfect squares.'
  ],
  pool(level) {
    return level === 1 ? [1, 20] : level === 2 ? [10, 60] : level === 3 ? [40, 140] : [80, 250];
  },
  generateQuestion(level, cards) {
    const [min, max] = this.pool(level);
    const now = Date.now();
    const due = Object.entries(cards)
      .filter(([, v]) => v.nextReview <= now && v.topic === this.id)
      .sort((a, b) => (b[1].priority || 1) - (a[1].priority || 1));
    const root = due.length ? Number(due[0][0]) : Math.floor(Math.random() * (max - min + 1)) + min;
    return { id: String(root), answer: root, prompt: `√${root * root}`, level };
  }
};
