import { expect, test, type Page } from '@playwright/test';

// 1×1 透明 PNG。外部タイルサーバーに依存しない決定的なテストにするため、地図タイルはこれで差し替える
const BLANK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const mapPaths = (page: Page) => page.locator('path.leaflet-interactive');
const rankingRows = (page: Page) => page.locator('tr[data-pref-code]');
const searchParam = (page: Page, key: string) => new URL(page.url()).searchParams.get(key);

let consoleErrors: string[];

test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  await page.route('**/cyberjapandata.gsi.go.jp/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_TILE }),
  );
});

test.afterEach(() => {
  expect(consoleErrors, 'コンソールエラーが発生していないこと').toEqual([]);
});

test('初期表示: 47 都道府県の地図とランキングが描画される', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle(/Utopia Finder/);
  await expect(mapPaths(page)).toHaveCount(47);
  await expect(rankingRows(page)).toHaveCount(47);
  // 状態が URL に書き戻され、8 種類すべてのウェイトが共有リンクに含まれる
  await expect.poll(() => searchParam(page, 'w_cc')).toBe('10');
});

test('指標の切り替えで地図の配色と URL が更新される', async ({ page }) => {
  await page.goto('./?metric=totalScore');
  await expect(mapPaths(page)).toHaveCount(47);
  const fillsBefore = await mapPaths(page).evaluateAll((els) => els.map((e) => e.getAttribute('fill')));

  await page.getByRole('button', { name: '食・温泉・カルチャー' }).click();
  await page.getByRole('button', { name: /グルメ充実度/ }).click();

  await expect(page.getByRole('button', { name: /グルメ充実度/ })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => searchParam(page, 'metric')).toBe('ramenCount');
  const fillsAfter = await mapPaths(page).evaluateAll((els) => els.map((e) => e.getAttribute('fill')));
  expect(fillsAfter).not.toEqual(fillsBefore);
});

test('共有 URL から状態を復元し、不正な値は無視する', async ({ page }) => {
  await page.goto('./?metric=__proto__&prefs=13,999,47&year=2020');
  await expect(rankingRows(page)).toHaveCount(47);
  await expect.poll(() => searchParam(page, 'metric')).toBe('totalScore');
  await expect.poll(() => searchParam(page, 'prefs')).toBe('13,47');
  await expect(page.locator('tr[data-pref-code="13"]')).toHaveAttribute('aria-selected', 'true');
});

test('ランキング行はキーボードで選択できる (最大 3 県まで比較)', async ({ page }) => {
  await page.goto('./');
  const rows = rankingRows(page);
  await expect(rows).toHaveCount(47);
  for (const i of [0, 1, 2, 3]) {
    await rows.nth(i).focus();
    await page.keyboard.press('Enter');
  }
  await expect.poll(() => searchParam(page, 'prefs')?.split(',').length).toBe(3);
});

test('地図の都道府県クリックで選択状態が切り替わる', async ({ page }) => {
  await page.goto('./');
  await expect(mapPaths(page)).toHaveCount(47);
  await mapPaths(page).first().dispatchEvent('click');
  await expect.poll(() => searchParam(page, 'prefs')).not.toBeNull();
  await mapPaths(page).first().dispatchEvent('click');
  await expect.poll(() => searchParam(page, 'prefs')).toBeNull();
});

test('CSV インポート後はウェイトが同じでも新しいデータで再計算される (回帰テスト)', async ({ page }) => {
  await page.goto('./?metric=ramenCount&year=2024');
  await expect(rankingRows(page)).toHaveCount(47);
  await expect(rankingRows(page).first()).not.toContainText('沖縄県');

  await page.getByRole('button', { name: 'CSVデータのインポート' }).click();
  const csv = ['都道府県コード,都道府県名,年,ラーメン', '13,東京都,2024,100', '1,北海道,2024,200', '47,沖縄県,2024,99999'].join('\n');
  await page.locator('input[type="file"]').setInputFiles({ name: 'custom.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });

  await expect(rankingRows(page)).toHaveCount(3);
  await expect(rankingRows(page).first()).toContainText('沖縄県');
});

test('理想郷ガチャ: 抽選 → 決定でモーダルが閉じ、その県が選択される', async ({ page }) => {
  await page.goto('./');
  await expect(rankingRows(page)).toHaveCount(47);
  await page.getByRole('button', { name: /理想郷ガチャ/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /ここに決める/ }).click();

  await expect(dialog).toBeHidden();
  await expect.poll(() => searchParam(page, 'prefs')?.split(',').length).toBe(1);
  expect(Number(searchParam(page, 'w_sb')) + Number(searchParam(page, 'w_on'))).toBeGreaterThan(0);
});

test('隠しコマンド: コナミコマンドでレトロモードに切り替わる', async ({ page }) => {
  await page.goto('./');
  await expect(rankingRows(page)).toHaveCount(47);
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
    await page.keyboard.press(key);
  }
  await expect(page.locator('body')).toHaveClass(/retro-mode/);
  await page.getByRole('button', { name: /にげる/ }).click();
  await expect(page.locator('body')).not.toHaveClass(/retro-mode/);
});

test('ページ幅からはみ出す要素がない (横スクロールが発生しない)', async ({ page }) => {
  await page.goto('./');
  await expect(rankingRows(page)).toHaveCount(47);
  const report = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    // 失敗時の診断用: ビューポート右端を越えている要素を列挙する
    const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed')
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} → right=${Math.round(el.getBoundingClientRect().right)}`);
    return { overflow, offenders };
  });
  expect(report.overflow, report.offenders.join('\n')).toBeLessThanOrEqual(0);
});
