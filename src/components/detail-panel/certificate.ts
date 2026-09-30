import type { MetricWeights, PrefectureData } from '../../types/prefecture';
import { generatePrefectureCatchphrase } from '../../utils/catchphrase';
import { classifyPersonality } from '../../utils/personality';

/** 「理想郷移住認定証」を Canvas に描画し、PNG としてダウンロードさせる */
export const downloadUtopiaCertificate = (targetPref: PrefectureData, weights: MetricWeights): void => {
  const style = classifyPersonality(weights, targetPref);
  const catchphrase = generatePrefectureCatchphrase(targetPref);

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 背景グラデーション
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, '#1e1b4b');
  gradient.addColorStop(0.5, '#311042');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);

  // 装飾枠
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 15;
  ctx.strokeRect(20, 20, 560, 360);

  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 544, 344);

  // 四隅のゴールドアクセント
  ctx.fillStyle = '#fbbf24';
  const cornerSize = 10;
  ctx.fillRect(28, 28, cornerSize, cornerSize);
  ctx.fillRect(572 - cornerSize, 28, cornerSize, cornerSize);
  ctx.fillRect(28, 372 - cornerSize, cornerSize, cornerSize);
  ctx.fillRect(572 - cornerSize, 372 - cornerSize, cornerSize, cornerSize);

  // ヘッダー
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FCTX 理想郷移住認定証', 300, 75);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('FUTURE CORTEX UTOPIA FINDER CERTIFICATE', 300, 95);

  // 区切り線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 115);
  ctx.lineTo(520, 115);
  ctx.stroke();

  // 本文
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('移住認定先 (Utopia):', 80, 150);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px sans-serif';
  ctx.fillText(`${targetPref.prefName} (${targetPref.year}年)`, 80, 185);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('あなたの移住スタイル (Personality Style):', 80, 225);

  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${style.emoji} ${style.name}`, 80, 250);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'italic 11px sans-serif';
  ctx.fillText(`"${catchphrase.text}"`, 80, 285);

  // ゴールドスタンプ
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(485, 235, 42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
  ctx.beginPath();
  ctx.arc(485, 235, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 10px sans-serif';
  ctx.fillText('FCTX', 485, 224);
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('APPROVED', 485, 238);
  ctx.font = '900 9px sans-serif';
  ctx.fillText('理想郷査証', 485, 252);

  // フッター
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '7px monospace';
  ctx.fillText(`SERIAL: FCTX-${targetPref.prefCode}-${targetPref.year}-${Math.floor(Math.random() * 9000 + 1000)}`, 80, 345);
  ctx.fillText('ISSUED BY FUTURE CORTEX UTOPIA FINDER', 80, 360);

  // ダウンロード
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `fctx_utopia_certificate_${targetPref.prefName}.png`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
