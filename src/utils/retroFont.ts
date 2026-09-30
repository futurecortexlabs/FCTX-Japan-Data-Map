const RETRO_FONT_URL = 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap';

/**
 * レトロモード専用のドットフォントを初回有効化時にだけ読み込む。
 * 通常利用者は隠しモードを使わないため、初期表示でレンダーブロッキングな外部 CSS を取得しない。
 */
export function loadRetroFont(): void {
  if (typeof document === 'undefined' || document.querySelector(`link[href="${RETRO_FONT_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = RETRO_FONT_URL;
  document.head.appendChild(link);
}
