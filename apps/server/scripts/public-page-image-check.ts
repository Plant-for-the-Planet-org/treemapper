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

  // 4. Chosen photos for the photos block.
  const LEGACY = '67b5a5bd8e743773056073.jpg'; // a migrated field photo name
  const photosOf = (photos: unknown[]) =>
    sanitizePublicPageBlocks([{ id: 'photos', key: 'p', content: { photos } }])[0]?.content?.photos ?? [];

  const picked = photosOf([
    { folder: 'tree', image: GOOD, caption: '  Planting day  ' },
    { folder: 'site', image: LEGACY },
    { folder: 'project', image: GOOD },
    { folder: 'tree', image: GOOD }, // repeat
    { folder: 'project', image: LEGACY }, // uploads must use the strict shape
    { folder: 'tree', image: 'https://evil.example/x.jpg' },
    { folder: 'tree', image: '../intervention/x.jpg' },
    { folder: 'profile', image: GOOD }, // not a photo folder
  ]);
  check(
    'picks keep valid field photos, uploads and order',
    JSON.stringify(picked.map((p) => `${p.folder}/${p.image}`)) ===
      JSON.stringify([`tree/${GOOD}`, `site/${LEGACY}`, `project/${GOOD}`]),
  );
  check('pick caption is trimmed', picked[0]?.caption === 'Planting day');
  check(
    'picks are capped at 12',
    photosOf(Array.from({ length: 20 }, (_, i) => ({ folder: 'tree', image: `${1794070425900 + i}-a.jpg` })))
      .length === 12,
  );

  const pickErrors = async (photos: unknown[]) =>
    errorsFor({ layouts: { full: [{ id: 'photos', key: 'p', content: { photos } }] } });
  check('DTO accepts a field photo and an upload', (await pickErrors([
    { folder: 'tree', image: LEGACY },
    { folder: 'project', image: GOOD },
  ])).length === 0);
  check('DTO refuses a URL pick', (await pickErrors([{ folder: 'tree', image: BAD[0] }])).length > 0);
  check('DTO refuses a path pick', (await pickErrors([{ folder: 'tree', image: '../x.jpg' }])).length > 0);
  check('DTO refuses a legacy name as an upload', (await pickErrors([{ folder: 'project', image: LEGACY }])).length > 0);
  check('DTO refuses an unknown folder', (await pickErrors([{ folder: 'profile', image: GOOD }])).length > 0);
  check(
    'DTO refuses more than 12 picks',
    (await pickErrors(Array.from({ length: 13 }, () => ({ folder: 'tree', image: GOOD })))).length > 0,
  );

  // 5. Cover priority: custom cover, then project.image, then the gallery.
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
