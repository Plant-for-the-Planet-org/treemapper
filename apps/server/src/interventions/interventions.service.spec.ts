import { InterventionsService } from './interventions.service';
import { interventionConfigurationSeedData } from 'src/database/schema/interventionConfig';

// Regression tests for createNewInterventionWeb with no species in the body.
// The web client omits the `species` key entirely for intervention types that
// do not allow species (maintenance, fencing, fire-patrol, ...), which used to
// crash with "Cannot read properties of undefined (reading 'map')".

const SPECIES_OPTIONAL_TYPES = interventionConfigurationSeedData
  .filter(c => !c.requiresSpecies)
  .map(c => c.interventionType);

const SPECIES_REQUIRED_TYPES = interventionConfigurationSeedData
  .filter(c => c.requiresSpecies)
  .map(c => c.interventionType);

const polygonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [11.601995, 48.177048],
            [11.605769, 48.175246],
            [11.608066, 48.177386],
            [11.604292, 48.179188],
            [11.601995, 48.177048],
          ],
        ],
      },
    },
  ],
};

const membership = { projectId: 1, userId: 2 } as any;

const webDto = (type: string) => ({
  type,
  captureMode: 'off-site',
  geometry: polygonFeatureCollection,
  registrationDate: new Date().toISOString(),
  metadata: { app: {}, public: {}, private: {} },
  treeCount: 0,
  interventionStartDate: '2026-11-10T00:00:00.000Z',
  interventionEndDate: '2026-11-10T00:00:00.000Z',
});

function makeMocks() {
  const inserted: { values: any }[] = [];
  const db = {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(async () => [
            { approvalBoardEnabled: false, approvalSettings: null },
          ]),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn((values: any) => {
        inserted.push({ values });
        return {
          returning: jest.fn(async () => [
            Array.isArray(values)
              ? values.map((v: any, i: number) => ({ ...v, id: i + 1 }))
              : { ...values, id: 1 },
          ].flat()),
        };
      }),
    })),
  };
  const drizzleService = { db } as any;
  const auditService = { log: jest.fn() } as any;
  return { db, inserted, drizzleService, auditService };
}

describe('createNewInterventionWeb without species', () => {
  it('covers every intervention type in one of the two lists', () => {
    expect(SPECIES_OPTIONAL_TYPES.length + SPECIES_REQUIRED_TYPES.length).toBe(
      interventionConfigurationSeedData.length,
    );
    expect(SPECIES_OPTIONAL_TYPES).toContain('maintenance');
    expect(SPECIES_REQUIRED_TYPES).toContain('single-tree-registration');
  });

  it.each(SPECIES_OPTIONAL_TYPES)(
    'creates a %s intervention when the species key is absent',
    async type => {
      const { db, inserted, drizzleService, auditService } = makeMocks();
      const service = new InterventionsService(drizzleService, auditService);

      await expect(
        service.createNewInterventionWeb(webDto(type), membership),
      ).resolves.toEqual({});

      // Exactly one insert: the intervention row. No species insert.
      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(inserted[0].values.type).toBe(type);
      expect(inserted[0].values.totalTreeCount).toBe(0);
      expect(auditService.log).toHaveBeenCalledTimes(1);
    },
  );

  it.each(SPECIES_REQUIRED_TYPES)(
    'rejects a %s intervention without species instead of crashing',
    async type => {
      const { db, drizzleService, auditService } = makeMocks();
      const service = new InterventionsService(drizzleService, auditService);

      await expect(
        service.createNewInterventionWeb(webDto(type), membership),
      ).rejects.toThrow('At least one species is required');

      expect(db.insert).not.toHaveBeenCalled();
    },
  );
});
