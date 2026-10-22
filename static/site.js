// ReMask showcase: the masks are precomputed colored PNGs, not browser-side inference.
// The palette follows the eight-class SUIM harmonization used in the ReMask project.
// For quantitative analysis, use original class-ID masks rather than these figure crops.
const scenes = {
  reef: { description: 'fish and reef', note: 'Fish and reef' },
  ray: { description: 'a ray and diver in open water', note: 'Ray and diver in open water' },
  diver: { description: 'a diver with an underwater robot', note: 'Diver and underwater robot' }
};
const labels = [
  { name: 'Background', rgb: [0, 0, 0] },
  { name: 'Diver', rgb: [0, 0, 255] },
  { name: 'Plant', rgb: [0, 255, 0] },
  { name: 'Wreck', rgb: [0, 255, 255] },
  { name: 'Robot', rgb: [255, 0, 0] },
  { name: 'Reef', rgb: [255, 0, 255] },
  { name: 'Fish', rgb: [255, 255, 0] },
  { name: 'Sea-floor', rgb: [255, 255, 255] }
];

const comparison = document.querySelector('.comparison');
const range = document.querySelector('#comparison-range');
const overlay = document.querySelector('#class-overlay');
const overlayContext = overlay.getContext('2d');
const sceneButtons = [...document.querySelectorAll('.scene-choice')];
const classButtons = [...document.querySelectorAll('.class-chip')];
const modeButtons = [...document.querySelectorAll('.viewer-mode')];
const opacitySlider = document.querySelector('#highlight-opacity');
const opacityValue = document.querySelector('#opacity-value');
const viewerStatus = document.querySelector('#viewer-status');
const maskCache = new Map();

let sceneKey = 'reef';
let mode = 'compare';
let selectedClass = 'all';
let requestNumber = 0;

range.addEventListener('input', () => {
  comparison.style.setProperty('--split', range.value + '%');
  range.setAttribute('aria-valuetext', range.value + '% input image, ' + (100 - range.value) + '% ReMask prediction');
});

// A pixel's closest palette color identifies its semantic class.
// Anti-aliased edge pixels in the cropped PNGs are assigned to the nearest class.
function closestClass(red, green, blue) {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < labels.length; i++) {
    const [r, g, b] = labels[i].rgb;
    const distance = (red - r) ** 2 + (green - g) ** 2 + (blue - b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

async function getMask(key) {
  if (maskCache.has(key)) return maskCache.get(key);
  const image = new Image();
  image.src = 'static/images/scenes/' + key + '-prediction.png';
  await image.decode();
  const buffer = document.createElement('canvas');
  buffer.width = image.naturalWidth;
  buffer.height = image.naturalHeight;
  const context = buffer.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const rgba = context.getImageData(0, 0, buffer.width, buffer.height).data;
  const classes = new Uint8Array(buffer.width * buffer.height);
  const counts = new Uint32Array(labels.length);
  for (let pixel = 0, offset = 0; pixel < classes.length; pixel++, offset += 4) {
    const id = closestClass(rgba[offset], rgba[offset + 1], rgba[offset + 2]);
    classes[pixel] = id;
    counts[id]++;
  }
  const mask = { width: buffer.width, height: buffer.height, classes, counts };
  maskCache.set(key, mask);
  return mask;
}

function updateClassButtons(mask) {
  // Keep the demo compact: show only classes present in the selected example.
  for (const button of classButtons) {
    const key = button.dataset.class;
    button.hidden = key !== 'all' && mask.counts[Number(key)] === 0;
  }
  if (selectedClass !== 'all' && mask.counts[Number(selectedClass)] === 0) {
    selectedClass = 'all';
  }
  for (const button of classButtons) {
    button.setAttribute('aria-pressed', String(mode === 'explore' && button.dataset.class === selectedClass));
  }
}

function renderOverlay() {
  if (mode !== 'explore') return;
  const mask = maskCache.get(sceneKey);
  if (!mask) return;

  if (overlay.width !== mask.width) overlay.width = mask.width;
  if (overlay.height !== mask.height) overlay.height = mask.height;
  const result = overlayContext.createImageData(mask.width, mask.height);
  const output = result.data;
  const strength = Math.round(Number(opacitySlider.value) * 2.55);

  for (let pixel = 0, offset = 0; pixel < mask.classes.length; pixel++, offset += 4) {
    const id = mask.classes[pixel];
    // In "All objects", leave the black background transparent so the photo remains visible.
    if (selectedClass === 'all' ? id === 0 : id !== Number(selectedClass)) continue;
    const [red, green, blue] = labels[id].rgb;
    output[offset] = red;
    output[offset + 1] = green;
    output[offset + 2] = blue;
    output[offset + 3] = strength;
  }
  overlayContext.putImageData(result, 0, 0);
}

function updateStatus() {
  if (mode === 'compare') {
    viewerStatus.textContent = 'Compare the input image with the ReMask prediction.';
  } else if (!maskCache.has(sceneKey)) {
    viewerStatus.textContent = 'Loading the selected prediction…';
  } else {
    const className = selectedClass === 'all' ? 'All predicted objects' : labels[Number(selectedClass)].name;
    viewerStatus.textContent = className + ' · Click an area of the image to inspect its predicted class.';
  }
}

function setMode(nextMode) {
  mode = nextMode;
  comparison.classList.toggle('is-exploring', mode === 'explore');
  range.disabled = mode === 'explore';
  document.querySelector('#highlight-controls').hidden = mode !== 'explore';
  modeButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
  const mask = maskCache.get(sceneKey);
  if (mask) updateClassButtons(mask);
  renderOverlay();
  updateStatus();
}

async function setScene(key) {
  const scene = scenes[key];
  if (!scene) return;
  sceneKey = key;
  const thisRequest = ++requestNumber;
  for (const [id, kind, label] of [['input-image', 'input', 'Original underwater image of'], ['prediction-image', 'prediction', 'ReMask prediction of']]) {
    const image = document.getElementById(id);
    image.src = 'static/images/scenes/' + key + '-' + kind + '.' + (kind === 'input' ? 'webp' : 'png');
    image.alt = label + ' ' + scene.description;
  }
  sceneButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.scene === key));
  });
  document.querySelector('#sample-note').textContent = 'SUIM test example · ' + scene.note;
  overlayContext.clearRect(0, 0, overlay.width, overlay.height);
  updateStatus();
  try {
    const mask = await getMask(key);
    if (thisRequest !== requestNumber) return;
    updateClassButtons(mask);
    renderOverlay();
    updateStatus();
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    console.error('Failed to load precomputed segmentation mask', error);
    setMode('compare');
    viewerStatus.textContent = 'This example could not be loaded. The comparison view is still available.';
  }
}

function selectClass(key) {
  const mask = maskCache.get(sceneKey);
  if (!mask || (key !== 'all' && !mask.counts[Number(key)])) return;
  selectedClass = key;
  setMode('explore');
}

sceneButtons.forEach(button => button.addEventListener('click', () => setScene(button.dataset.scene)));
classButtons.forEach(button => button.addEventListener('click', () => selectClass(button.dataset.class)));
modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
opacitySlider.addEventListener('input', () => {
  opacityValue.textContent = opacitySlider.value + '%';
  renderOverlay();
});

comparison.addEventListener('click', event => {
  if (mode !== 'explore') return;
  const mask = maskCache.get(sceneKey);
  if (!mask) return;
  const rect = comparison.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * mask.width / rect.width);
  const y = Math.floor((event.clientY - rect.top) * mask.height / rect.height);
  if (x < 0 || x >= mask.width || y < 0 || y >= mask.height) return;
  selectClass(String(mask.classes[y * mask.width + x]));
});

setScene(sceneKey);
