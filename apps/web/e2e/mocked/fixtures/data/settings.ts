import type { ProjectWithUserRoleI } from '@shared-core/types/interface.app';

import { fail, ok } from '../../helpers/envelope';
import type { ApiMock } from '../api-mock';
import { MAIN_PROJECT, SECOND_PROJECT } from './session';

interface SettingsPageOptions {
  /**
   * The projects `GET projects/<uid>` knows. Any other uid gets a 404, the
   * answer for a project that does not exist or is not yours. Default: the
   * main and second projects.
   */
  projects?: ProjectWithUserRoleI[];
}

// The settings page's own loads, for any project. The General tab reads the
// project and its images; the project body is the same shape as the list
// entry, and the page only copies the fields it shows. Only the features tab
// asks for the api key, and no data means "no key yet".
export function mockSettingsPage(
  api: ApiMock,
  { projects = [MAIN_PROJECT, SECOND_PROJECT] }: SettingsPageOptions = {}
) {
  api
    .get(/^projects\/[^/]+$/, ({ path }) => {
      const uid = path.split('/')[1];
      const project = projects.find(p => p.uid === uid);
      return project ? ok(project) : fail(404, 'Project not found');
    })
    .get(/^projects\/[^/]+\/images$/, ok([]))
    .get(/^projects\/[^/]+\/api-key$/, ok(null));
}
