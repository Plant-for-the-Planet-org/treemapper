import { OBSERVATION_FIELDS, TREE_FIELDS } from './csvFields';

/**
 * Downloadable CSV templates. Headers come straight from the field specs, so a
 * template the user downloads always auto-maps on the way back in and the mapping
 * dialog never appears for it.
 *
 * Each template carries two example rows. They are meant to be overwritten, and
 * the wizard tells the user so.
 */

const toCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows]
    .map((row) => row.map((cellValue) => {
      const v = cellValue ?? '';
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','))
    .join('\n');

const download = (fileName: string, csv: string) => {
  // Prepend a BOM so Excel opens UTF-8 species names correctly.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function downloadTreeTemplate() {
  const headers = TREE_FIELDS.map((f) => f.templateHeader);
  // Tag T-001 appears twice on purpose: it shows how measurement history works.
  // T-003 is a recruit, to show the second option for that column.
  const rows = [
    ['52.520100', '13.404900', 'T-001', 'Quercus robur', '2024-03-15', '1.20', '3.5', '2023-11-02', 'planted'],
    ['52.520100', '13.404900', 'T-001', 'Quercus robur', '2026-03-18', '2.05', '5.1', '2023-11-02', 'planted'],
    ['52.520140', '13.405020', 'T-002', 'Fagus sylvatica', '2026-03-18', '0.85', '2.2', '2023-11-02', 'planted'],
    ['52.520180', '13.405110', 'T-003', 'Betula pendula', '2026-03-18', '0.60', '1.4', '', 'recruit'],
  ];
  download('plot-trees-template.csv', toCsv(headers, rows));
}

export function downloadObservationTemplate() {
  const headers = OBSERVATION_FIELDS.map((f) => f.templateHeader);
  const rows = [
    ['soil_moisture', '2026-03-18', '42.5', '%'],
    ['canopy', '2026-03-18', '65', '%'],
    ['grass_cover', '2026-03-18', '30', '%'],
  ];
  download('plot-observations-template.csv', toCsv(headers, rows));
}

/**
 * The plot sheet is a convenience, not a required input: the wizard's step 1 form
 * is the real source. Uploading a filled copy pre-fills that form.
 */
export const PLOT_TEMPLATE_HEADERS = [
  'name', 'plot_type', 'shape',
  'radius_m', 'length_m', 'width_m',
  'center_latitude', 'center_longitude', 'established_on',
];

export function downloadPlotTemplate() {
  const rows = [
    ['North ridge plot 1', 'intervention', 'circle', '10', '', '', '52.520000', '13.405000', '2026-03-18'],
    ['Control plot A', 'control', 'rectangle', '', '20', '20', '52.521000', '13.406000', '2026-03-18'],
  ];
  download('plot-details-template.csv', toCsv(PLOT_TEMPLATE_HEADERS, rows));
}
