import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

// Server-driven form (built on the web app, synced to mobile for offline use).
// `sections` holds the stringified FormSection[] JSON, matching the codebase
// convention of storing nested structures as strings (see FormElement.dropDownData).
export const ProjectForm: ObjectSchema = {
  name: RealmSchema.ProjectForm,
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    project_id: { type: 'string', default: '', indexed: true },
    status: { type: 'string', default: 'published' },
    site_assignment: { type: 'string', default: 'all' }, // 'all' | 'none' | 'specific'
    intervention_assignment: { type: 'string', default: 'all' }, // 'all' | 'specific'
    site_ids: { type: 'list', objectType: 'string', default: [] },
    intervention_types: { type: 'list', objectType: 'string', default: [] },
    sections: { type: 'string', default: '[]' },
    created_at: { type: 'string', default: '' },
    updated_at: { type: 'string', default: '' },
  },
};
