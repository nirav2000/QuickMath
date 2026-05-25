export const squareRootsTopic = {
  id: 'square-roots',
  label: 'Square Roots',
  caption: 'Square roots with progression + spaced repetition',
  tips: [
    'Anchor squares to memorize: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25, 6²=36, 7²=49, 8²=64, 9²=81, 10²=100, 11²=121, 12²=144, 13²=169, 14²=196, 15²=225, 16²=256, 17²=289, 18²=324, 19²=361, 20²=400, 21²=441, 22²=484, 23²=529, 24²=576, 25²=625.',
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
