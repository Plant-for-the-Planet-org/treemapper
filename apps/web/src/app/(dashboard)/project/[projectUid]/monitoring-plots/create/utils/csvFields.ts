/**
 * Column specs for the tree and observation CSVs.
 *
 * Each field lists the header names it recognises. `autoMapColumns` uses these to
 * load a file straight through when it matches the downloadable template (or
 * anything close to it), and the mapping dialog only appears when a required
 * field cannot be found. Aliases are compared with punctuation and case stripped,
 * so "Height (m)", "height_m" and "HEIGHT M" all land on the same field.
 */

export interface FieldSpec {
  /** Key on the parsed row object. */
  key: string;
  /** Shown in the mapping dialog and the template header. */
  label: string;
  /** Header name written into the downloadable template. */
  templateHeader: string;
  required: boolean;
  hint?: string;
  /** Accepted header names, most specific first. */
  aliases: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export const TREE_FIELDS: FieldSpec[] = [
  {
    key: 'latitude',
    label: 'Latitude',
    templateHeader: 'latitude',
    required: true,
    hint: 'Decimal degrees, e.g. 52.5200',
    aliases: ['latitude', 'lat', 'ycoordinate', 'y'],
  },
  {
    key: 'longitude',
    label: 'Longitude',
    templateHeader: 'longitude',
    required: true,
    hint: 'Decimal degrees, e.g. 13.4050',
    aliases: ['longitude', 'lng', 'lon', 'long', 'xcoordinate', 'x'],
  },
  {
    key: 'tag',
    label: 'Tree tag',
    templateHeader: 'tag',
    required: false,
    hint: 'Repeat the same tag on several rows to record measurement history',
    aliases: ['tag', 'treetag', 'treeid', 'treenumber', 'label', 'plantid', 'id'],
  },
  {
    key: 'species',
    label: 'Species',
    templateHeader: 'species',
    required: false,
    hint: 'Scientific name. Unmatched names save as unknown species',
    aliases: ['species', 'speciesname', 'scientificname', 'botanicalname', 'scientific'],
  },
  {
    key: 'measurementDate',
    label: 'Measurement date',
    templateHeader: 'measurement_date',
    required: false,
    hint: 'YYYY-MM-DD or DD/MM/YYYY',
    aliases: ['measurementdate', 'measureddate', 'measuredon', 'surveydate', 'recordeddate', 'date'],
  },
  {
    key: 'height',
    label: 'Height (m)',
    templateHeader: 'height_m',
    required: false,
    aliases: ['heightm', 'heightmetres', 'heightmeters', 'height', 'treeheight', 'ht'],
  },
  {
    key: 'width',
    label: 'Diameter (cm)',
    templateHeader: 'width_cm',
    required: false,
    aliases: ['widthcm', 'diametercm', 'diameter', 'dbhcm', 'dbh', 'crownwidth', 'width'],
  },
  {
    key: 'plantingDate',
    label: 'Planting date',
    templateHeader: 'planting_date',
    required: false,
    aliases: ['plantingdate', 'planteddate', 'plantedon', 'dateplanted'],
  },
  {
    key: 'origin',
    label: 'Planted or recruit',
    templateHeader: 'planted_or_recruit',
    required: false,
    hint: 'planted, or recruit for a tree growing naturally in the plot. Blank counts as planted',
    aliases: [
      'plantedorrecruit', 'plantorrecruit', 'origin', 'treeorigin',
      'plantorigin', 'treetype', 'planttype', 'type',
    ],
  },
];

export const OBSERVATION_FIELDS: FieldSpec[] = [
  {
    key: 'type',
    label: 'Observation type',
    templateHeader: 'type',
    required: true,
    hint: 'e.g. soil_moisture, canopy, grass_cover',
    aliases: ['observationtype', 'obstype', 'type', 'parameter', 'metric', 'observation'],
  },
  {
    key: 'observedAt',
    label: 'Observation date',
    templateHeader: 'observation_date',
    required: true,
    hint: 'YYYY-MM-DD or DD/MM/YYYY',
    aliases: ['observationdate', 'observedon', 'obsdate', 'recordeddate', 'measurementdate', 'date'],
  },
  {
    key: 'value',
    label: 'Value',
    templateHeader: 'value',
    required: false,
    aliases: ['value', 'reading', 'result', 'amount', 'measurement'],
  },
  {
    key: 'unit',
    label: 'Unit',
    templateHeader: 'unit',
    required: false,
    hint: 'Anything you use, up to 10 characters. e.g. %, kpa, ppm',
    aliases: ['unit', 'units', 'uom'],
  },
];

export type ColumnMapping = Record<string, string>;

export interface AutoMapResult {
  mapping: ColumnMapping;
  /** Required field keys no header could be found for. */
  missingRequired: string[];
}

/**
 * Best-effort header to field assignment. Fields are resolved in spec order and
 * a header is consumed once used, so a sheet with both "date" and "planting_date"
 * assigns each to the right field instead of both to the first match.
 */
export function autoMapColumns(headers: string[], fields: FieldSpec[]): AutoMapResult {
  const available = headers.map((h) => ({ header: h, normalized: norm(h) }));
  const used = new Set<string>();
  const mapping: ColumnMapping = {};

  for (const field of fields) {
    for (const alias of field.aliases) {
      const exact = available.find((c) => !used.has(c.header) && c.normalized === alias);
      if (exact) {
        mapping[field.key] = exact.header;
        used.add(exact.header);
        break;
      }
    }
    if (mapping[field.key]) continue;
    // Fall back to a contains match, longest alias first so "plantingdate" wins
    // over "date" for a header like "Planting Date (approx)".
    for (const alias of [...field.aliases].sort((a, b) => b.length - a.length)) {
      if (alias.length < 3) continue;
      const partial = available.find((c) => !used.has(c.header) && c.normalized.includes(alias));
      if (partial) {
        mapping[field.key] = partial.header;
        used.add(partial.header);
        break;
      }
    }
  }

  const missingRequired = fields
    .filter((f) => f.required && !mapping[f.key])
    .map((f) => f.key);

  return { mapping, missingRequired };
}
