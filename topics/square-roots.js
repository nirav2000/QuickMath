export const squareRootsTopic = {
  id: 'square-roots',
  label: 'Square Roots',
  caption: 'Square roots with progression + spaced repetition',
  tips: [
    'Learn anchor squares 1²..40².',
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
