/**
 * Read-only checks for public-page images: the stored-value rule, request
 * validation, and cover priority. Writes nothing.
 *
 *   npx ts-node --transpile-only scripts/public-page-image-check.ts
 */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PublicPageSettingsDto } from '../src/public-page/dto/public-page-settings.dto';
import { PublicPageService } from '../src/public-page/public-page.service';
import {
  resolvePublicPageSettings,
  sanitizePublicPageBlocks,
} from '../src/public-page/public-page.types';

let failures = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
};

const GOOD = '1794070425949-pnghz4.jpg';
const BAD = [
  'https://evil.example/x.jpg',
  '//evil.example/x.jpg',
  '../tree/1794070425949-pnghz4.jpg',
  '1794070425949-pnghz4.heic',
  '1794070425949-pnghz4.svg',
  'javascript:alert(1)',
  '',
];

async function main() {
  // 1. Stored layouts: the sanitizer keeps a real filename and drops anything else.
  const kept = sanitizePublicPageBlocks([
    { id: 'image', key: 'image-1', content: { image: GOOD, caption: '  A caption  ', alt: 'Alt' } },
  ]);
  check('sanitizer keeps an uploaded filename', kept[0]?.content?.image === GOOD);
  check('sanitizer trims the caption', kept[0]?.content?.caption === 'A caption');
  check('sanitizer accepts the new block id', kept[0]?.id === 'image');

  for (const bad of BAD) {
    const out = sanitizePublicPageBlocks([{ id: 'image', key: 'k', content: { image: bad } }]);
    check(`sanitizer drops image ${JSON.stringify(bad)}`, out[0]?.content?.image === undefined);
  }

  // 2. Stored cover: same rule through the settings resolver.
  check(
    'resolver keeps a valid cover',
    resolvePublicPageSettings({ publicPage: { coverImage: GOOD } }).coverImage === GOOD,
  );
  check(
    'resolver nulls a URL cover',
    resolvePublicPageSettings({ publicPage: { coverImage: BAD[0] } }).coverImage === null,
  );
  check('cover defaults to null', resolvePublicPageSettings({}).coverImage === null);

  // 3. Requests: the DTO refuses a URL before anything is stored.
  const errorsFor = async (body: unknown) =>
    validate(plainToInstance(PublicPageSettingsDto, body), { whitelist: true });

  check('DTO accepts a valid cover', (await errorsFor({ coverImage: GOOD })).length === 0);
  check('DTO accepts null cover (reset)', (await errorsFor({ coverImage: null })).length === 0);
  check('DTO refuses a URL cover', (await errorsFor({ coverImage: BAD[0] })).length > 0);
  check(
    'DTO accepts an image block',
    (await errorsFor({
      layouts: { full: [{ id: 'image', key: 'image-1', content: { image: GOOD, caption: 'c' } }] },
    })).length === 0,
  );
  check(
    'DTO refuses a URL inside an image block',
    (await errorsFor({
      layouts: { full: [{ id: 'image', key: 'image-1', content: { image: BAD[0] } }] },
    })).length > 0,
  );
  check(
    'DTO refuses a too-long caption',
    (await errorsFor({
      layouts: { full: [{ id: 'image', key: 'k', content: { image: GOOD, caption: 'x'.repeat(201) } }] },
    })).length > 0,
  );

  // 4. Cover priority: custom cover, then project.image, then the gallery.
  const neverQueried = {
    db: {
      select: () => {
        throw new Error('gallery queried when it should not be');
      },
    },
  } as any;
  const service = new PublicPageService(neverQueried, {} as any) as any;
  check(
    'custom cover wins over project.image',
    (await service.loadCover({ id: 1, image: 'legacy.jpg' }, GOOD)) === GOOD,
  );
  check(
    'project.image used when no custom cover',
    (await service.loadCover({ id: 1, image: 'legacy.jpg' }, null)) === 'legacy.jpg',
  );

  console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
