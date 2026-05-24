export const percentagesTopic = {
  id: 'percentages',
  label: 'Percentages',
  caption: 'Percentages with progression + spaced repetition',
  tips: [
    '10%=divide by 10, 1%=divide by 100.',
    'Use 5%=half of 10%, 15%=10%+5%.',
    'Find x% of y by y*x/100.',
    'For increase/decrease use base ± percent of base.'
  ],
  pool(level) {
    return level === 1 ? [10, 99] : level === 2 ? [100, 499] : level === 3 ? [500, 1999] : [2000, 9999];
  },
  generateQuestion(level) {
    const [min, max] = this.pool(level);
    const base = Math.floor(Math.random() * (max - min + 1)) + min;
    const pct = [5, 10, 12, 15, 20, 25, 30, 40, 50, 75][Math.floor(Math.random() * 10)];
    const ans = Number(((base * pct) / 100).toFixed(2));
    return { id: `${pct}%of${base}`, answer: ans, prompt: `${pct}% of ${base}`, level };
  }
};
