/**
 * generate-panorama.js
 * LineBreaker 전체 씬 파노라마 컨셉 아트 5종 생성
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE =
  `Wide panoramic 2D side-scrolling concept art for a medieval fantasy tower defense mobile game. ` +
  `LEFT SIDE: A bright heroic kingdom castle. An army of cartoon warriors and mages charging forward to the right. ` +
  `Leading the charge in the center is a dragon rider hero — a young agile warrior in light leather armor (NO heavy plate armor), ` +
  `riding a majestic blue-and-gold dragon, flying above the troops. ` +
  `RIGHT SIDE: A dark menacing enemy fortress. On top of the enemy castle looms a massive terrifying Demon Lord / Dark Overlord — ` +
  `a giant evil boss with glowing red eyes, dark robes, and enormous horns, towering over the castle. ` +
  `The battlefield between them has dust, magical explosions, dramatic atmosphere. ` +
  `Bold cartoon art style, thick outlines, vibrant cinematic colors. ` +
  `Single wide illustration, no text, no UI.`;

const VARIANTS = [
  {
    id: 'panorama_01',
    name: '황혼의 전장',
    extra: `Dramatic sunset sky with orange and purple hues, long shadows, epic and emotional tone.`,
  },
  {
    id: 'panorama_02',
    name: '폭풍의 전장',
    extra: `Dark stormy sky with lightning bolts, rain, intense and chaotic battle atmosphere.`,
  },
  {
    id: 'panorama_03',
    name: '새벽의 진격',
    extra: `Early dawn sky with golden light breaking through clouds, hopeful and heroic tone, mist on the ground.`,
  },
  {
    id: 'panorama_04',
    name: '마법 폭발',
    extra: `Night sky filled with magical explosions of blue and purple, glowing arcane runes on the ground, mystical atmosphere.`,
  },
  {
    id: 'panorama_05',
    name: '불꽃의 전쟁',
    extra: `Blazing battlefield with fire everywhere, the dragon breathing flames, smoke and embers filling the sky, intense war atmosphere.`,
  },
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const dest = path.resolve(__dirname, '..', destPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('\n🎨 LineBreaker 파노라마 컨셉 아트 생성 시작');
  console.log(`📦 총 ${VARIANTS.length}개 (wide 1792x1024)`);
  console.log(`💰 예상 비용: 약 $${(VARIANTS.length * 0.08).toFixed(2)}\n`);

  let success = 0;

  for (const v of VARIANTS) {
    console.log(`[${success + 1}/${VARIANTS.length}] ${v.id} — ${v.name}`);
    try {
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: `${BASE} ${v.extra}`,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        response_format: 'url',
      });

      const imageUrl = response.data[0].url;
      const savePath = `Art/panorama/${v.id}_${v.name}.png`;
      const dest = await downloadImage(imageUrl, savePath);
      console.log(`  ✅ 저장: ${dest}\n`);
      success++;

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ❌ 실패: ${err.message}\n`);
    }
  }

  console.log(`\n🏁 완료: ${success}/${VARIANTS.length}개`);
  console.log(`📁 저장 위치: C:\\qortmdduf\\LineBreaker\\Art\\panorama\\`);
}

main();
