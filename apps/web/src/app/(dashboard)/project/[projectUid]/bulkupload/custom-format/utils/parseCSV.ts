import Papa from 'papaparse';
import { Intervention, Species, ValidationResult } from '../types';

export interface FieldMapping {
    geoJSONFileName: string;
    plantationDate: string;
    speciesColumns: string[];
}

export interface CsvSample {
    headers: string[];
    sampleRows: Record<string, string>[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

// Accepts DD/MM/YYYY (day first), zero-padding optional, and verifies the
// day/month combination is a real calendar date.
function isValidDate(dateStr: string): boolean {
    const s = dateStr.trim();
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return false;
    const [day, month, year] = s.split('/').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function validateIntervention(plantDate: string, species: Species[]): ValidationResult {
    const errors: string[] = [];

    if (!plantDate || !isValidDate(plantDate)) {
        errors.push('Invalid or missing plantation date (expected DD/MM/YYYY)');
    }

    if (species.length === 0) {
        errors.push('At least one species with a count > 0 is required');
    }

    return { isValid: errors.length === 0, errors, needsGeoJSON: true };
}

// ─── CSV reading ──────────────────────────────────────────────────────────────

export function getCsvSample(file: File): Promise<CsvSample> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            preview: 5,
            dynamicTyping: false,
            complete: (result) => resolve({
                headers: result.meta.fields ?? [],
                sampleRows: result.data as Record<string, string>[],
            }),
            error: reject,
        });
    });
}

// ─── Auto-mapping intelligence ────────────────────────────────────────────────

function sampleValues(header: string, rows: Record<string, string>[]): string[] {
    return rows.map(r => (r[header] ?? '').trim()).filter(Boolean);
}

function scoreForGeoJSON(header: string, values: string[]): number {
    const h = header.toLowerCase();
    let score = 0;

    // Header keyword signals
    if (h.includes('geojson') || h.includes('kml'))                         score += 12;
    if (h.includes('beneficiar'))                                            score += 10;
    if (h.includes('filename') || h.includes('file_name'))                  score += 9;
    if (h.includes('file'))                                                  score += 6;
    if (h.includes('titulo') || h.includes('title'))                        score += 5;
    if (h.includes('nombre') || h === 'name')                               score += 4;
    if (h === 'id' || h.includes('codigo') || h.includes('code'))           score += 3;
    if (h.includes('site') || h.includes('plot') || h.includes('parcel'))   score += 3;

    // Value pattern signals
    for (const v of values) {
        const vl = v.toLowerCase();
        if (vl.endsWith('.geojson') || vl.endsWith('.kml'))   { score += 15; break; }
        if (vl.endsWith('.json'))                              { score += 8;  break; }
    }

    // Down-score obviously date-like or numeric values
    const numericCount = values.filter(v => !isNaN(Number(v))).length;
    if (values.length > 0 && numericCount / values.length > 0.8) score -= 8;

    return score;
}

function scoreForDate(header: string, values: string[]): number {
    const h = header.toLowerCase();
    let score = 0;

    // Header keyword signals
    if (h.includes('fecha de plant') || h.includes('plantation date'))  score += 14;
    if (h.includes('fecha') || h.includes('date'))                      score += 10;
    if (h.includes('plant') && (h.includes('date') || h.includes('fecha'))) score += 4;
    if (h.includes('planted') || h.includes('planting'))                score += 6;
    if (h.includes('start') || h.includes('inicio'))                    score += 3;

    // Value pattern signals
    const dateLike = values.filter(v =>
        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v) ||  // DD/MM/YYYY
        /^\d{4}-\d{2}-\d{2}/.test(v)              // ISO date
    );
    if (values.length > 0 && dateLike.length / values.length >= 0.5) score += 12;

    return score;
}

function scoreForSpecies(header: string, values: string[]): number {
    const h = header.toLowerCase();
    let score = 0;

    // Values are mostly numeric integers → strong signal for counts
    const numericInts = values.filter(v => /^\d+$/.test(v.trim()));
    if (values.length > 0 && numericInts.length / values.length >= 0.5) score += 10;

    // Header looks like a species or plant name
    if (h.includes('specie') || h.includes('especie'))  score += 6;
    if (h.includes('tree') || h.includes('arbol'))      score += 4;
    if (h.includes('plant') && !h.includes('date') && !h.includes('fecha')) score += 2;

    // Down-score totals / non-species numeric columns
    if (h.includes('total') || h.includes('suma') || h === 'count') score -= 6;
    if (h.includes('people') || h.includes('person') || h.includes('number of')) score -= 6;
    if (h.includes('elevation') || h.includes('height') || h.includes('diameter')) score -= 6;
    if (h.includes('id') || h.includes('lat') || h.includes('lon') || h.includes('lng')) score -= 8;

    return score;
}

export function autoMapFields(headers: string[], sampleRows: Record<string, string>[]): Partial<FieldMapping> {
    const used = new Set<string>();
    const result: Partial<FieldMapping> = {};

    // Score every header for GeoJSON role — pick best
    const geoScores = headers
        .map(h => ({ h, score: scoreForGeoJSON(h, sampleValues(h, sampleRows)) }))
        .sort((a, b) => b.score - a.score);
    if (geoScores[0]?.score > 0) {
        result.geoJSONFileName = geoScores[0].h;
        used.add(geoScores[0].h);
    }

    // Score remaining for date — pick best
    const dateScores = headers
        .filter(h => !used.has(h))
        .map(h => ({ h, score: scoreForDate(h, sampleValues(h, sampleRows)) }))
        .sort((a, b) => b.score - a.score);
    if (dateScores[0]?.score > 0) {
        result.plantationDate = dateScores[0].h;
        used.add(dateScores[0].h);
    }

    // Score remaining for species — include all with positive score
    result.speciesColumns = headers
        .filter(h => !used.has(h))
        .map(h => ({ h, score: scoreForSpecies(h, sampleValues(h, sampleRows)) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ h }) => h)
        .slice(0, 20);

    return result;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

export function parseCSVWithMapping(file: File, mapping: FieldMapping): Promise<Intervention[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (result) => {
                const interventions: Intervention[] = (result.data as any[]).map((row, i) => {
                    const beneficiary = row[mapping.geoJSONFileName]?.trim() ?? `Row ${i + 1}`;
                    const plantDate = row[mapping.plantationDate]?.trim() ?? '';

                    const species: Species[] = mapping.speciesColumns
                        .filter(col => col)
                        .map(col => ({
                            name: col,
                            count: parseInt(row[col] ?? '0', 10) || 0,
                        }))
                        .filter(s => s.count > 0);

                    const validation = validateIntervention(plantDate, species);

                    return {
                        id: `inv_${i}_${Date.now()}`,
                        beneficiary,
                        plantDate,
                        species,
                        geojson: null,
                        geojsonFileName: null,
                        isEdited: false,
                        validation,
                    };
                });
                resolve(interventions);
            },
            error: reject,
        });
    });
}
