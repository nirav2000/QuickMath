function formatTipContent(text) {
  if (text.trim().startsWith('<')) return text;
  return `<p>${text}</p>`;
}

export function renderTips(tipsContainer, topicConfig, topicCaptionEl) {
  tipsContainer.innerHTML = topicConfig.tips
    .map((text, i) => `<article><h3>Step ${i + 1}</h3>${formatTipContent(text)}</article>`)
    .join('');
  topicCaptionEl.textContent = topicConfig.caption;
}
