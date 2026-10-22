// Run against a local static server; Playwright is a development-only dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.EXPLORER_URL || 'http://127.0.0.1:8084/';
const palette = [[0,0,0],[0,0,255],[0,255,0],[0,255,255],[255,0,0],[255,0,255],[255,255,0],[255,255,255]];

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.comparison').getAttribute('aria-busy') === 'false');
}

// Read the source PNG independently to check rendered pixels and click coordinates.
async function sourceMask(page) {
  return page.locator('#prediction-image').evaluate(image => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const palette = [[0,0,0],[0,0,255],[0,255,0],[0,255,255],[255,0,0],[255,0,255],[255,255,0],[255,255,255]];
    const ids = [], points = {};
    for (let i = 0; i < pixels.length; i += 4) {
      const distances = palette.map(rgb => rgb.reduce((n, v, j) => n + (v - pixels[i+j]) ** 2, 0));
      const id = distances.indexOf(Math.min(...distances));
      ids.push(id);
      const x = (i / 4) % canvas.width, y = Math.floor(i / 4 / canvas.width);

    }
    // Choose interiors, not one-pixel boundary fragments that disappear at CSS scale.
    for (let y = 24; y < canvas.height - 24; y++) {
      for (let x = 24; x < canvas.width - 24; x++) {
        const id = ids[y * canvas.width + x];
        if (points[id]) continue;
        const interior = [-10,0,10].every(dy => [-10,0,10].every(dx => ids[(y+dy)*canvas.width+x+dx] === id));
        if (interior) points[id] = {x,y};
      }
    }
    window.__qaMask = {width: canvas.width, height: canvas.height, ids, points};
    return window.__qaMask;
  });
}

async function assertOverlay(page, mask, selected, opacity) {
  const failure = await page.locator('#class-overlay').evaluate((canvas, {selected, opacity, palette}) => {
    const rgba = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const ids = window.__qaMask.ids;
    for (let pixel = 0; pixel < ids.length; pixel++) {
      const id = ids[pixel], offset = pixel * 4;
      const shown = selected === 'all' ? id !== 0 : id === Number(selected);
      if (rgba[offset+3] !== (shown ? Math.round(opacity*2.55) : 0)) return 'Alpha mismatch at pixel '+pixel;
      if (shown && opacity && palette[id].some((v,j) => Math.abs(rgba[offset+j]-v)>1)) return 'Color mismatch at pixel '+pixel;
    }
    return null;
  }, {selected, opacity, palette});
  assert.equal(failure,null,'Overlay class '+selected);
}

(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.EXPLORER_BROWSER ? {executablePath: process.env.EXPLORER_BROWSER} : {})});
  const out = process.env.EXPLORER_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'remask-explorer-'));
  await fs.mkdir(out, {recursive: true});
  try {
    const page = await browser.newPage({viewport: {width:1440, height:1000}, reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await ready(page);
    const compare = page.locator('#comparison-range');
    await compare.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await compare.inputValue(), '51');
    assert.equal(await page.locator('.comparison').evaluate(e => e.style.getPropertyValue('--split')), '51%');

    const sceneKeys = await page.locator('.scene-choice').evaluateAll(nodes => nodes.map(n=>n.dataset.scene));
    assert.equal(sceneKeys.length,6);
    for (const scene of sceneKeys) {
      console.log('Checking scene: '+scene);
      await page.locator(`[data-scene="${scene}"]`).click();
      await ready(page);
      const mask = await sourceMask(page);
      const box = await page.locator('.comparison').boundingBox();
      assert.ok(Math.abs(box.width/box.height-mask.width/mask.height)<.01,'Preserve image/mask aspect ratio');
      const present = new Set(mask.ids.map(String));
      const chips = await page.locator('.class-chip').evaluateAll(nodes => nodes.map(n => ({key:n.dataset.class, hidden:n.hidden})));
      for (const chip of chips) {
        assert.equal(chip.hidden, chip.key !== 'all' && !present.has(chip.key));
        if (chip.hidden) continue;
        await page.locator(`[data-class="${chip.key}"]`).click();
        await assertOverlay(page, mask, chip.key, 65);
        assert.equal(await page.locator('.class-chip[aria-pressed="true"]').count(), 1);
      }
      // Inspect a foreground class and background at CSS-scaled pixel centers.
      for (const id of ['0','6']) {
        const point = mask.points[id];
        if (!point) continue;
        await page.locator('.comparison').scrollIntoViewIfNeeded();
        const rect = await page.locator('.comparison').boundingBox();
        await page.mouse.click(rect.x + (point.x + .5) / mask.width * rect.width, rect.y + (point.y + .5) / mask.height * rect.height);
        assert.equal(await page.locator(`[data-class="${id}"]`).getAttribute('aria-pressed'), 'true', `Click class ${id} in ${scene}`);
      }
      const opacity = page.locator('#highlight-opacity');
      for (const value of [0, 100, 35, 65]) {
        await opacity.fill(String(value));
        assert.equal(await page.locator('#opacity-value').textContent(), value + '%');
        const key = await page.locator('.class-chip[aria-pressed="true"]').getAttribute('data-class');
        await assertOverlay(page, mask, key, value);
      }
      await opacity.focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await opacity.inputValue(), '60');
      await opacity.fill('65');
      await page.locator('[data-mode="compare"]').click();
      assert.equal(await compare.isEnabled(), true);
      assert.equal(await compare.inputValue(), '51');
      assert.equal(await page.locator('#highlight-controls').isVisible(), false);
    }

    // Keep a selected class if present; fall back to All objects when it disappears.
    await page.locator('[data-scene="diver"]').click();
    await ready(page);
    await page.locator('[data-class="1"]').click();
    await page.locator('[data-scene="reef"]').click();
    await ready(page);
    assert.equal(await page.locator('[data-class="all"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-class="6"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-class="6"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-scene="ray"]').click();
    await ready(page);
    assert.equal(await page.locator('[data-class="6"]').getAttribute('aria-pressed'), 'true');

    for (const width of [1440,1024,820,768,760,390,320]) {
      await page.setViewportSize({width, height:900});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
      const mask = await sourceMask(page), point = mask.points['1'];
      await page.locator('.comparison').scrollIntoViewIfNeeded();
      const rect = await page.locator('.comparison').boundingBox();
      await page.mouse.click(rect.x + (point.x+.5)/mask.width*rect.width, rect.y + (point.y+.5)/mask.height*rect.height);
      assert.equal(await page.locator('[data-class="1"]').getAttribute('aria-pressed'), 'true', `Click mapping at ${width}px`);
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('.showcase').screenshot({path:path.join(out,'desktop.png')});
    console.log('Desktop, all classes, opacity, keyboard, and responsive widths passed.');

    const mobile = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    await mobile.goto(base);
    await ready(mobile);
    await mobile.locator('[data-class="6"]').tap();
    const mask = await sourceMask(mobile), point = mask.points['0'];
    await mobile.locator('.comparison').scrollIntoViewIfNeeded();
    const rect = await mobile.locator('.comparison').boundingBox();
    await mobile.touchscreen.tap(rect.x+(point.x+.5)/mask.width*rect.width,rect.y+(point.y+.5)/mask.height*rect.height);
    assert.equal(await mobile.locator('[data-class="0"]').getAttribute('aria-pressed'),'true');
    const targets = await mobile.locator('.class-chip:visible,.viewer-mode,.scene-choice').evaluateAll(nodes => nodes.map(n=>n.getBoundingClientRect().height));
    assert.ok(targets.every(height=>height>=44),'Touch targets must be at least 44px high');
    await mobile.locator('.showcase').screenshot({path:path.join(out,'mobile.png')});
    await mobile.close();

    // Deliberately let the PNG finish before the photo, then switch scenes again.
    const race = await browser.newPage();
    let release, delayed;
    const arrived = new Promise(resolve => delayed = resolve);
    const gate = new Promise(resolve => release = resolve);
    await race.route('**/ray-input.webp', async route => {delayed(); await gate; await route.continue();});
    await race.goto(base);
    await ready(race);
    await race.locator('[data-class="6"]').click();
    await race.locator('[data-scene="ray"]').click();
    await arrived;
    assert.equal(await race.locator('.comparison').getAttribute('aria-busy'),'true');
    assert.equal(await race.locator('.class-chip:enabled').count(),0);
    assert.equal(await race.locator('#highlight-opacity').isDisabled(),true);
    await race.locator('[data-scene="diver"]').click();
    await ready(race);
    release();
    await race.waitForLoadState('networkidle');
    assert.match(await race.locator('#input-image').getAttribute('src'),/diver-input/);
    await assertOverlay(race,await sourceMask(race),'6',65);
    await race.close();

    // Simulate one Canvas read failure: Compare survives, and a scene click retries.
    const recovery = await browser.newPage();
    await recovery.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.getImageData;
      let fail = true;
      CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        if (fail) {fail=false;throw new Error('Simulated mask read failure');}
        return original.apply(this,args);
      };
    });
    await recovery.goto(base);
    await ready(recovery);
    assert.equal(await recovery.locator('[data-mode="explore"]').isDisabled(),true);
    assert.equal(await recovery.locator('#comparison-range').isEnabled(),true);
    assert.match(await recovery.locator('#viewer-status').textContent(),/unavailable/);
    await recovery.locator('[data-scene="reef"]').click();
    await ready(recovery);
    await recovery.locator('[data-class="6"]').click();
    assert.match(await recovery.locator('#viewer-status').textContent(),/Fish \/ vertebrates highlighted/);
    await recovery.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: all scene/class pixels, click/tap mapping, opacity, keyboard, compare retention, 320-1440px layout, loading races, and failure recovery.');
    console.log('Screenshots: '+out);
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
