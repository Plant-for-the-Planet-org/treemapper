import {INTERVENTION_TYPE} from 'src/types/type/app.type'

export const AllIntervention: Array<{
  label: string
  value: INTERVENTION_TYPE
  index: number
}> = [
  {
    label: 'Single Tree Plantation',
    value: 'single-tree-registration',
    index: 0,
  },
  {label: 'Multi Tree Plantation', value: 'multi-tree-registration', index: 0},
  {label: 'Fire Patrol', value: 'fire-patrol', index: 0},
  {label: 'Fire Supression Team', value: 'fire-suppression', index: 0},
  {label: 'Eastablish Fire Breaks', value: 'firebreaks', index: 0},
  {label: 'Fencing', value: 'fencing', index: 0},
  {
    label: 'Removal of Invasive Species',
    value: 'removal-invasive-species',
    index: 0,
  },
  {label: 'Direct Seding', value: 'direct-seeding', index: 0},
  {label: 'Grass Suppression', value: 'grass-suppression', index: 0},
  {label: 'Marking Regenerant', value: 'marking-regenerant', index: 0},
  {label: 'Enrichement Planting', value: 'enrichement-planting', index: 0},
  {label: 'Liberating Regenerant', value: 'liberating-regenerant', index: 0},
  {label: 'Soil Improvement', value: 'soil-improvement', index: 0},
  {label: 'Assisting Seed Rain', value: 'assisting-seed-rain', index: 0},
  {label: 'Stop Tree Harvesting', value: 'stop-tree-harvesting', index: 0},
  {label: 'Maintenance', value: 'maintenance', index: 0},
  {label: 'Other Intervention', value: 'other-intervention', index: 0},
]


export const AllIntervenionType  = AllIntervention.map(el=>el.value)