import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { setAppModeOverride } from 'src/store/slice/appStateSlice'
import { AppMode } from 'src/types/type/app.type'

/**
 * Simple or Full view.
 *
 * Simple shows only what a planter needs: the Map and My trees tabs, and a
 * "+" menu with just the two planting flows. Full is the whole toolbox. Both
 * use the same screens; Simple only hides entry points, so nothing is lost by
 * switching.
 *
 * Who decides, first match wins:
 *   1. the person, from the "Simple view" switch in the side drawer
 *   2. the project default the project admin picked on the dashboard
 *   3. otherwise Simple when signed out, Full when signed in
 *
 * Rule 3 is what a fresh install meets: no account, no project, so Simple.
 * Signed-in users keep Full until their project sets a default, so field
 * teams see no change the day this ships.
 *
 * The person's choice is cleared whenever it matches the default, so a later
 * change of the project default still reaches them.
 */
export const resolveDefaultAppMode = (
  projectDefault: AppMode | null,
  isLoggedIn: boolean,
): AppMode => projectDefault ?? (isLoggedIn ? 'full' : 'simple')

const isAppMode = (value: unknown): value is AppMode =>
  value === 'simple' || value === 'full'

/**
 * Picks each project's default view out of the project list response.
 *
 * The server does not send this yet. The field it is expected to arrive in is
 * `properties.appMode` ('simple' | 'full'); until then every project is
 * missing here and rule 3 above applies.
 */
export const appModesFromProjects = (projects: any[]): Record<string, AppMode> => {
  const modes: Record<string, AppMode> = {}
  for (const project of projects || []) {
    const id = project?.properties?.id
    const mode = project?.properties?.appMode
    if (id && isAppMode(mode)) {
      modes[id] = mode
    }
  }
  return modes
}

const useAppMode = () => {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  // Older installs rehydrate without these fields, hence the fallbacks.
  const override = useSelector(
    (state: RootState) => state.appState.appModeOverride ?? null,
  )
  const projectDefault = useSelector((state: RootState) => {
    const id = state.projectState.currentProject.projectId
    return (id && state.projectState.projectAppModes?.[id]) || null
  })

  const defaultMode = resolveDefaultAppMode(projectDefault, isLoggedIn)
  const mode: AppMode = override ?? defaultMode

  const setMode = useCallback(
    (next: AppMode) => {
      dispatch(setAppModeOverride(next === defaultMode ? null : next))
    },
    [dispatch, defaultMode],
  )

  return {
    mode,
    isSimple: mode === 'simple',
    defaultMode,
    setMode,
  }
}

export default useAppMode
