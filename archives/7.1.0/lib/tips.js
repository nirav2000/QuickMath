export function renderTips(tipsContainer, topicConfig, topicCaptionEl) {
  tipsContainer.innerHTML = topicConfig.tips
    .map((text, i) => `<article><h3>Step ${i + 1}</h3><p>${text}</p></article>`)
    .join('');
  topicCaptionEl.textContent = topicConfig.caption;
}
