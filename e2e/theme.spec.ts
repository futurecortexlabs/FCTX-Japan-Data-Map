import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * 配色の回帰テスト。
 * - チャートのツールチップ文字が背景に対して WCAG AA (4.5:1) 以上のコントラストを持つこと
 * - 画面内のテーマ切替が OS 設定と食い違っても、UI 全体が一貫したテーマになること
 */

/** 要素の文字色と、実際に見えている (不透明な祖先の) 背景色から WCAG コントラスト比を求める */
const contrastRatio = (locator: Locator) =>
  locator.evaluate((el) => {
    const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const luminance = ([r, g, b]: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    let bgEl: Element | null = el;
    let bg = [255, 255, 255];
    while (bgEl) {
      const c = parse(getComputedStyle(bgEl).backgroundColor);
      if (c.length >= 3 && (c[3] ?? 1) > 0.5) {
        bg = c;
        break;
      }
      bgEl = bgEl.parentElement;
    }
    const [l1, l2] = [luminance(parse(getComputedStyle(el).color)), luminance(bg)].sort((a, b) => b - a);
    return (l1 + 0.05) / (l2 + 0.05);
  });

const hoverFirstBar = async (page: Page) => {
  const bar = page.locator('.recharts-rectangle').first();
  await bar.waitFor();
  const box = (await bar.boundingBox())!;
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
};

// ツールチップはマウスホバー前提のため、タッチ端末エミュレーション (mobile プロジェクト) では対象外
test.skip(({ isMobile }) => isMobile, 'hover はマウス操作前提');

test.beforeEach(async ({ page }) => {
  await page.route('**/cyberjapandata.gsi.go.jp/**', (route) => route.fulfill({ status: 204 }));
});

for (const scheme of ['light', 'dark'] as const) {
  test(`チャートのツールチップ文字が読める (OS: ${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    await hoverFirstBar(page);

    const tooltip = page.locator('.recharts-default-tooltip').last();
    await expect(tooltip).toBeVisible();
    for (const part of [tooltip.locator('.recharts-tooltip-label'), tooltip.locator('.recharts-tooltip-item').first()]) {
      expect(await contrastRatio(part)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test(`テーマ切替が OS 設定 (${scheme}) より優先され、UI 全体に反映される`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    const before = await header.evaluate((el) => getComputedStyle(el.ownerDocument.body.firstElementChild!.firstElementChild!).backgroundColor);

    await page.getByRole('button', { name: /モードに切り替え/ }).click();
    await expect(page.locator('html')).toHaveClass(scheme === 'light' ? /dark/ : /^(?!.*dark)/);
    const after = await header.evaluate((el) => getComputedStyle(el.ownerDocument.body.firstElementChild!.firstElementChild!).backgroundColor);
    expect(after).not.toBe(before);

    // 切替後もツールチップが読める
    await hoverFirstBar(page);
    const item = page.locator('.recharts-default-tooltip .recharts-tooltip-item').last();
    await expect(item).toBeVisible();
    expect(await contrastRatio(item)).toBeGreaterThanOrEqual(4.5);
  });
}
