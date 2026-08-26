'use client';

import { Pill, Section, SectionTitle, ctaPrimarySm, ctaSecondarySm } from './primitives';

const FORMATS = ['GeoJSON', 'CSV', 'QGIS · ArcGIS', 'R · Python', 'Public API'];

const SNIPPET = `{
  "type": "Feature",
  "properties": {
    "type": "multi",
    "captureMode": "on-site",
    "plantDate": "2026-05-25",
    "plantedSpecies": [
      { "treeCount": 50,  "species": "Cedrela odorata" },
      { "treeCount": 100, "species": "Swietenia macrophylla" }
    ],
    "measurements": { "height": 1.4, "width": 2.6 }
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[-74.25796, 3.79762], [-74.25612, 3.79910]]
  }
}`;

export function DataExport({ onOpenDataExplorer }: { onOpenDataExplorer: () => void }) {
  return (
    <Section id="data" className="bg-tm-cream" innerClassName="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <SectionTitle className="mb-4 lg:text-[32px]">Can you export TreeMapper data to QGIS or ArcGIS?</SectionTitle>
        <p className="mb-[18px] text-base leading-[1.7] text-tm-body">
          Yes. Nothing is locked in. Export raw GeoJSON straight from the device or from the dashboard, with polygon and
          point geometry intact, and open it in QGIS, ArcGIS, R, Python or Google Earth Engine. If you would rather not
          export at all, pull the same records live through the public API.
        </p>
        <p className="mb-[22px] text-base leading-[1.7] text-tm-body">
          This is what makes TreeMapper usable as the field-data layer of a wider MRV or remote sensing workflow: your
          GIS analyst gets real geometry, not a screenshot of a map.
        </p>

        <div className="mb-6 flex flex-wrap gap-2.5">
          {FORMATS.map(format => (
            <Pill key={format} className="px-3.5 py-[9px]">
              {format}
            </Pill>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onOpenDataExplorer} className={ctaPrimarySm()}>
            Open DataExplorer
          </button>
          <a
            href="https://docs.treemapper.app/en"
            target="_blank"
            rel="noopener noreferrer"
            className={ctaSecondarySm()}
          >
            Read the API docs
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-tm-ink p-[22px] shadow-[0_4px_16px_rgba(0,0,0,.14)]">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <span className="text-[11px] font-extrabold tracking-[1px] uppercase text-tm-lime">
            GET /treemapper/plantLocations
          </span>
          <span className="text-[10px] font-extrabold text-white/50">GeoJSON</span>
        </div>
        <pre className="overflow-x-auto font-mono text-xs leading-[1.7] text-white/85">{SNIPPET}</pre>
      </div>
    </Section>
  );
}
