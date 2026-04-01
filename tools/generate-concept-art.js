/**
 * generate-concept-art.js
 * LineBreaker 컨셉 아트 10종 생성
 * 저장 위치: Art/
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

const CONCEPTS = [
  {
    id: '01_battlefield',
    name: '전장 배경',
    prompt: `Epic medieval fantasy 2D side-scrolling battlefield background for a tower defense mobile game.
    A vast grassy field between two castles, dramatic sunset sky with clouds, distant mountains,
    bold cartoon art style, vibrant colors, thick outlines, highly detailed scenery.
    No characters, wide panoramic view.`
  },
  {
    id: '02_castle_ally',
    name: '아군 성',
    prompt: `A majestic medieval fantasy allied kingdom castle tower for a 2D tower defense game.
    Blue and gold color scheme, glowing magical banners, heroic and grand,
    bold cartoon art style, thick outlines, side view, transparent background.`
  },
  {
    id: '03_castle_enemy',
    name: '적군 성 (어둠의 요새)',
    prompt: `A dark and menacing medieval fantasy enemy fortress for a 2D tower defense game.
    Dark red and black color scheme, skull decorations, ominous flames, evil aura,
    bold cartoon art style, thick outlines, side view, transparent background.`
  },
  {
    id: '04_warrior',
    name: '전사 (기본 병사)',
    prompt: `A medieval fantasy cartoon warrior soldier character for a 2D tower defense mobile game.
    Brave foot soldier with sword and shield, full body front-facing,
    blue and silver armor, bold cartoon art style, thick outlines,
    vibrant colors, transparent background.`
  },
  {
    id: '05_archer',
    name: '궁수',
    prompt: `A medieval fantasy cartoon archer character for a 2D tower defense mobile game.
    Agile ranger with longbow and quiver, green hooded cloak, full body front-facing,
    bold cartoon art style, thick outlines, vibrant colors, transparent background.`
  },
  {
    id: '06_knight',
    name: '기사 (중장갑)',
    prompt: `A medieval fantasy cartoon heavily armored knight character for a 2D tower defense mobile game.
    Full plate armor with great sword, imposing and powerful, full body front-facing,
    gold and silver armor, bold cartoon art style, thick outlines, transparent background.`
  },
  {
    id: '07_mage',
    name: '마법사',
    prompt: `A medieval fantasy cartoon powerful wizard mage character for a 2D tower defense mobile game.
    Long robes with glowing magical staff, casting fire and arcane spells, full body front-facing,
    purple and gold robes, bold cartoon art style, thick outlines, transparent background.`
  },
  {
    id: '08_hero_dragon_rider',
    name: '영웅 — 용기사',
    prompt: `A legendary medieval fantasy cartoon hero dragon rider for a 2D tower defense mobile game.
    A heroic champion in golden armor riding a majestic blue and gold dragon,
    glowing aura, epic and powerful, full body side view,
    bold cartoon art style, thick outlines, transparent background.`
  },
  {
    id: '09_enemy_dragon',
    name: '적 — 어둠의 용',
    prompt: `A fearsome medieval fantasy cartoon enemy dark dragon boss for a 2D tower defense mobile game.
    A massive black and red dragon with glowing evil red eyes, breathing dark fire,
    menacing and terrifying, full body side view,
    bold cartoon art style, thick outlines, transparent background.`
  },
  {
    id: '10_ally_dragon',
    name: '아군 — 수호 용',
    prompt: `A majestic medieval fantasy cartoon friendly guardian dragon for a 2D tower defense mobile game.
    A noble blue and white dragon with glowing golden eyes, protective and heroic aura,
    wearing a magical crown or emblem, full body side view,
    bold cartoon art style, thick outlines, transparent background.`
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
  console.log('\n🎨 LineBreaker 컨셉 아트 생성 시작');
  console.log(`📦 총 ${CONCEPTS.length}개 이미지`);
  console.log(`💰 예상 비용: 약 $${(CONCEPTS.length * 0.04).toFixed(2)}\n`);

  let success = 0;

  for (const concept of CONCEPTS) {
    console.log(`[${success + 1}/${CONCEPTS.length}] ${concept.id} — ${concept.name}`);
    try {
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: concept.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      });

      const imageUrl = response.data[0].url;
      const savePath = `Art/${concept.id}_${concept.name}.png`;
      const dest = await downloadImage(imageUrl, savePath);
      console.log(`  ✅ 저장: ${dest}\n`);
      success++;

      // 레이트 리밋 방지
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ❌ 실패: ${err.message}\n`);
    }
  }

  console.log(`\n🏁 완료: ${success}/${CONCEPTS.length}개 생성됨`);
  console.log(`📁 저장 위치: C:\\qortmdduf\\LineBreaker\\Art\\`);
}

main();
