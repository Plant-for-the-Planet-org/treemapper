'use client';

import { ctaPrimary, ctaSecondary } from './primitives';

/** Pins are dropped over the drawn map at hand-picked spots, as in the concept. */
const HERO_PINS = [
  { src: '/pins/MultiTreePin.svg', left: '15%', top: '31%', size: 38 },
  { src: '/pins/SingleTreePin.svg', left: '27%', top: '44%', size: 32 },
  { src: '/pins/SingleTreePin.svg', left: '53%', top: '58%', size: 30 },
  { src: '/pins/InvasiveSpeciesPin.svg', left: '80%', top: '57%', size: 28 },
  { src: '/pins/SingleTreePin.svg', left: '21%', top: '68%', size: 26 },
  { src: '/pins/SingleTreePin.svg', left: '33%', top: '69%', size: 26 },
  { src: '/pins/MultiTreePin.svg', left: '45%', top: '77%', size: 28 },
  { src: '/pins/MultiTreePin.svg', left: '75%', top: '72%', size: 28 },
  { src: '/pins/SingleTreePin.svg', left: '84%', top: '76%', size: 26 },
];

/** Ground-level scrub, drawn twice (shadow pass and lit pass). */
const SCRUB = [
  'translate(66,398) scale(.42)',
  'translate(186,388) scale(.4)',
  'translate(306,424) scale(.44)',
  'translate(432,426) scale(.4)',
  'translate(560,428) scale(.42)',
  'translate(692,474) scale(.4)',
  'translate(812,490) scale(.38)',
  'translate(126,438) scale(.34)',
  'translate(248,432) scale(.32)',
  'translate(370,458) scale(.34)',
  'translate(496,458) scale(.32)',
  'translate(626,472) scale(.34)',
  'translate(752,510) scale(.32)',
  'translate(880,516) scale(.3)',
];

/** Street trees lining the urban grid on the right of the map. */
const STREET_TREES = [
  'translate(932,72) scale(.2)',
  'translate(932,176) scale(.2)',
  'translate(932,280) scale(.2)',
  'translate(932,384) scale(.2)',
  'translate(1030,110) scale(.19)',
  'translate(1100,110) scale(.19)',
  'translate(1170,110) scale(.19)',
  'translate(1240,110) scale(.19)',
  'translate(1030,214) scale(.19)',
  'translate(1100,214) scale(.19)',
  'translate(1170,214) scale(.19)',
  'translate(1240,214) scale(.19)',
  'translate(1030,318) scale(.19)',
  'translate(1100,318) scale(.19)',
  'translate(1170,318) scale(.19)',
  'translate(1240,318) scale(.19)',
];

/** Trees inside the small urban restoration plot. */
const PLOT_TREES = ['translate(1000,476) scale(.3)', 'translate(1048,464) scale(.28)', 'translate(1092,482) scale(.28)'];

const PARK_TREES = ['translate(1082,388) scale(.36)', 'translate(1120,406) scale(.32)'];

function Clumps({ transforms }: { transforms: string[] }) {
  return (
    <>
      {transforms.map(t => (
        <use key={t} href="#tmClump" transform={t} />
      ))}
    </>
  );
}

function HeroMap() {
  return (
    <svg
      viewBox="200 0 1080 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 block h-full w-full [mask-image:linear-gradient(90deg,transparent_0,rgba(0,0,0,.35)_8%,#000_26%)]"
    >
      <rect x="0" y="0" width="1280" height="600" fill="#FAF9F5" />

      {/* Shoreline and the track running along it */}
      <path
        d="M0 452 C150 424 250 486 400 470 C540 456 606 502 720 524 C842 548 960 530 1280 544 L1280 600 L0 600 Z"
        fill="#CFE3EE"
      />
      <path
        d="M0 452 C150 424 250 486 400 470 C540 456 606 502 720 524 C842 548 960 530 1280 544"
        fill="none"
        stroke="#B4D3E2"
        strokeWidth="2"
      />
      <path
        d="M0 424 C150 396 250 458 400 442 C540 428 606 474 720 496 C842 520 960 502 1280 516"
        fill="none"
        stroke="#DED6C4"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M0 424 C150 396 250 458 400 442 C540 428 606 474 720 496 C842 520 960 502 1280 516"
        fill="none"
        stroke="#F2EDE1"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      <g fill="#7EA468">
        <Clumps transforms={SCRUB} />
      </g>
      <g fill="#A6CC88" transform="translate(0,-5)">
        <Clumps transforms={SCRUB} />
      </g>

      {/* Roads */}
      <path
        d="M596 600 C640 452 764 372 1000 322 C1120 296 1214 292 1280 288"
        stroke="#E9E5DA"
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M596 600 C640 452 764 372 1000 322 C1120 296 1214 292 1280 288"
        stroke="#FFFFFF"
        strokeWidth="15"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M912 0 L912 468" stroke="#E9E5DA" strokeWidth="22" fill="none" />
      <path d="M912 0 L912 468" stroke="#FFFFFF" strokeWidth="14" fill="none" />
      <path d="M948 128 L1280 128 M948 232 L1280 232 M948 336 L1280 336" stroke="#FFFFFF" strokeWidth="9" fill="none" />
      <path d="M1046 30 L1046 452 M1166 30 L1166 452" stroke="#FFFFFF" strokeWidth="9" fill="none" />

      {/* City blocks */}
      <g fill="#E7E4DA">
        <rect x="952" y="34" width="62" height="76" rx="5" />
        <rect x="1056" y="34" width="92" height="76" rx="5" />
        <rect x="1178" y="34" width="72" height="76" rx="5" />
        <rect x="952" y="142" width="62" height="72" rx="5" />
        <rect x="1056" y="142" width="54" height="72" rx="5" />
        <rect x="1122" y="142" width="26" height="72" rx="5" />
        <rect x="1178" y="142" width="72" height="72" rx="5" />
        <rect x="952" y="246" width="62" height="72" rx="5" />
        <rect x="1056" y="246" width="92" height="44" rx="5" />
        <rect x="1056" y="300" width="92" height="18" rx="5" />
        <rect x="1178" y="246" width="72" height="72" rx="5" />
        <rect x="952" y="350" width="62" height="82" rx="5" />
        <rect x="1178" y="350" width="72" height="82" rx="5" />
      </g>
      <g fill="#D5D5D5">
        <rect x="952" y="34" width="62" height="9" rx="4" />
        <rect x="1056" y="34" width="92" height="9" rx="4" />
        <rect x="1178" y="246" width="72" height="9" rx="4" />
        <rect x="952" y="246" width="62" height="9" rx="4" />
      </g>

      {/* City park */}
      <rect x="1056" y="344" width="92" height="88" rx="8" fill="#DCEBCB" />
      <g fill="#8FB474">
        <Clumps transforms={PARK_TREES} />
      </g>
      <g fill="#B4D398" transform="translate(0,-5)">
        <Clumps transforms={PARK_TREES} />
      </g>

      {/* Cars on the grid */}
      <g fill="#A8AFB4">
        <rect x="901" y="52" width="7" height="15" rx="2.5" />
        <rect x="901" y="152" width="7" height="15" rx="2.5" />
        <rect x="901" y="262" width="7" height="15" rx="2.5" />
        <rect x="901" y="370" width="7" height="15" rx="2.5" />
        <rect x="916" y="86" width="7" height="15" rx="2.5" />
        <rect x="916" y="196" width="7" height="15" rx="2.5" />
        <rect x="916" y="308" width="7" height="15" rx="2.5" />
        <rect x="916" y="414" width="7" height="15" rx="2.5" />
      </g>
      <g fill="#C2C7CA">
        <rect x="901" y="104" width="7" height="15" rx="2.5" />
        <rect x="916" y="140" width="7" height="15" rx="2.5" />
        <rect x="901" y="316" width="7" height="15" rx="2.5" />
        <rect x="916" y="248" width="7" height="15" rx="2.5" />
      </g>
      <g fill="#A8AFB4">
        <rect x="982" y="120" width="15" height="7" rx="2.5" />
        <rect x="1072" y="120" width="15" height="7" rx="2.5" />
        <rect x="1198" y="120" width="15" height="7" rx="2.5" />
        <rect x="1016" y="133" width="15" height="7" rx="2.5" />
        <rect x="1136" y="133" width="15" height="7" rx="2.5" />
        <rect x="998" y="224" width="15" height="7" rx="2.5" />
        <rect x="1104" y="224" width="15" height="7" rx="2.5" />
        <rect x="1216" y="224" width="15" height="7" rx="2.5" />
        <rect x="1060" y="237" width="15" height="7" rx="2.5" />
        <rect x="1180" y="237" width="15" height="7" rx="2.5" />
        <rect x="990" y="328" width="15" height="7" rx="2.5" />
        <rect x="1122" y="328" width="15" height="7" rx="2.5" />
        <rect x="1208" y="341" width="15" height="7" rx="2.5" />
      </g>
      <g fill="#C2C7CA">
        <rect x="1046" y="120" width="15" height="7" rx="2.5" />
        <rect x="1160" y="224" width="15" height="7" rx="2.5" />
        <rect x="1054" y="328" width="15" height="7" rx="2.5" />
      </g>

      <g fill="#7EA468">
        <Clumps transforms={STREET_TREES} />
      </g>
      <g fill="#A6CC88" transform="translate(0,-3)">
        <Clumps transforms={STREET_TREES} />
      </g>

      {/* The forest itself: three stacked passes give the canopy depth */}
      <g fill="#8FB474">
        <use href="#tmForest" />
        <use href="#tmScrub" />
      </g>
      <g fill="#B4D398" transform="translate(0,-6)">
        <use href="#tmForest" />
        <use href="#tmScrub" />
      </g>
      <g fill="#CBE3B0" transform="translate(-3,-12)" opacity=".85">
        <use href="#tmForest" />
      </g>

      {/* Site boundaries: forest plot, restoration plot, urban plot */}
      <path
        d="M232 196 L470 150 L560 268 L432 372 L246 336 Z"
        fill="rgba(0,122,73,.13)"
        stroke="#007A49"
        strokeWidth="2.5"
        strokeDasharray="9 6"
      />
      <path d="M640 344 L836 322 L880 420 L744 462 L636 424 Z" fill="rgba(104,176,48,.16)" stroke="#68B030" strokeWidth="2.5" />
      <path d="M972 448 L1068 430 L1130 462 L1100 506 L1006 496 Z" fill="rgba(0,122,73,.15)" stroke="#007A49" strokeWidth="2.5" />
      <g fill="#7EA468">
        <Clumps transforms={PLOT_TREES} />
      </g>
      <g fill="#A6CC88" transform="translate(0,-4)">
        <Clumps transforms={PLOT_TREES} />
      </g>

      {/* Monitoring plot radius rings */}
      <circle cx="392" cy="262" r="54" fill="none" stroke="rgba(31,51,40,.22)" strokeWidth="1.5" />
      <circle cx="392" cy="262" r="82" fill="none" stroke="rgba(31,51,40,.14)" strokeWidth="1.5" />
    </svg>
  );
}

export function Hero({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  return (
    <div id="top" className="relative min-h-[600px] overflow-hidden bg-tm-cream">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[57%] md:block">
        <HeroMap />
        {HERO_PINS.map((pin, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${pin.src}-${i}`}
            src={pin.src}
            alt=""
            style={{ left: pin.left, top: pin.top, height: pin.size }}
            className="absolute"
          />
        ))}
      </div>

      <div className="relative z-[2] max-w-[560px] px-5 py-16 sm:px-8 md:px-14 md:pt-[88px] md:pb-20">
        <div className="mb-3 text-[15px] font-extrabold tracking-[.2px] text-tm-green">
          The open-source tree monitoring app
        </div>
        <h1 className="mb-[18px] text-pretty text-4xl leading-[1.02] font-extrabold tracking-[-1.2px] text-tm-ink sm:text-5xl lg:text-[60px] lg:tracking-[-1.8px]">
          Monitor, track and register trees.
        </h1>
        <p className="mb-[26px] max-w-[520px] text-lg leading-[1.6] text-tm-body">
          Let your restoration work tell its story with data. Record trees and interventions offline in the field,
          track survival on the dashboard, and export raw GeoJSON into QGIS or ArcGIS whenever you want it.
        </p>
        <div className="mb-[22px] flex flex-wrap gap-3">
          <button type="button" onClick={onOpenDashboard} className={ctaPrimary()}>
            Open the Dashboard
          </button>
          <a href="#download" className={ctaSecondary()}>
            Download the App
          </a>
        </div>
        <p className="text-[13px] font-bold text-tm-muted">
          Free to start, and always free for non-profits, small teams and Forest Cloud projects.
        </p>
      </div>
    </div>
  );
}
