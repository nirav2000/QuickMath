export function drawStats(els, list) {
  const t = list.length;
  const c = list.filter((a) => a.isCorrect).length;
  const w = t - c;
  const avg = t ? Math.round(list.reduce((s, a) => s + a.timeTakenMs, 0) / t) : 0;
  els.totalQuestions.textContent = String(t);
  els.correctCount.textContent = String(c);
  els.wrongCount.textContent = String(w);
  els.avgTime.textContent = String(avg);
  els.accuracyRate.textContent = `${t ? Math.round((c * 100) / t) : 0}%`;

  const map = {};
  list.forEach((a) => {
    const d = new Date(a.createdAt).toISOString().slice(0, 10);
    map[d] = (map[d] || 0) + 1;
  });
  els.activityCalendar.innerHTML = '';
  for (let i = 30; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const n = map[d] || 0;
    const e = document.createElement('div');
    e.className = `day-cell ${n > 20 ? 'level-4' : n > 10 ? 'level-3' : n > 4 ? 'level-2' : n > 0 ? 'level-1' : ''}`;
    els.activityCalendar.append(e);
  }

  const grouped = {};
  list.slice().reverse().forEach((a) => {
    const d = new Date(a.createdAt).toLocaleDateString();
    (grouped[d] = grouped[d] || []).push(a);
  });
  els.recentAttempts.innerHTML = '';
  Object.entries(grouped).slice(0, 8).forEach(([d, arr]) => {
    const b = document.createElement('div');
    b.className = 'attempt-group';
    b.innerHTML = `<h4>${d} • ${arr.length} attempts</h4>`;
    arr.slice(0, 20).forEach((a) => {
      const r = document.createElement('div');
      r.className = 'attempt-row';
      r.innerHTML = `<span>${a.question}</span><span>${a.isCorrect ? '✓' : '✗'}</span><span>${a.timeTakenMs}ms</span><span>L${a.level || 1}</span>`;
      b.append(r);
    });
    els.recentAttempts.append(b);
  });
}
