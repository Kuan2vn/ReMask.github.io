const scenes = {
  reef: { description: 'fish and reef', note: 'Fish and reef' },
  ray: { description: 'a ray and diver in open water', note: 'Ray and diver in open water' },
  diver: { description: 'a diver with an underwater robot', note: 'Diver and underwater robot' }
};
const comparison = document.querySelector('.comparison');
const range = document.querySelector('#comparison-range');
range.addEventListener('input', () => {
  comparison.style.setProperty('--split', `${range.value}%`);
  range.setAttribute('aria-valuetext', `${range.value}% input image, ${100 - range.value}% ReMask prediction`);
});
document.querySelectorAll('.scene-choice').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.scene;
    const scene = scenes[key];
    for (const [id, kind, label] of [['input-image', 'input', 'Original underwater image of'], ['prediction-image', 'prediction', 'ReMask prediction of']]) {
      const image = document.getElementById(id);
      image.src = `static/images/scenes/${key}-${kind}.${kind === "input" ? "webp" : "png"}`;
      image.alt = `${label} ${scene.description}`;
    }
    document.querySelectorAll('.scene-choice').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    document.querySelector('#sample-note').textContent = `SUIM test example · ${scene.note}`;
  });
});
