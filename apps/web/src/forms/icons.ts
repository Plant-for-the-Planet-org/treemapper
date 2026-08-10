import type { ComponentType } from 'react'
import {
  Type, Hash, Calendar, ChevronDown, CheckSquare, CircleDot,
} from 'lucide-react'
import { FieldType } from './types'
import { FIELD_TYPE_META } from './constants'

type IconComponent = ComponentType<{ className?: string }>

/** Maps the icon names stored in `constants.ts` to their lucide components. */
const ICON_MAP: Record<string, IconComponent> = {
  Type, Hash, Calendar, ChevronDown, CheckSquare, CircleDot,
}

/** Resolve the icon component for a field type, or null if unknown. */
export function getFieldIcon(type: FieldType): IconComponent | null {
  const meta = FIELD_TYPE_META.find(m => m.type === type)
  return meta ? ICON_MAP[meta.icon] ?? null : null
}

/** Resolve an icon component by its stored name (e.g. from field meta). */
export function getIconByName(name: string): IconComponent | null {
  return ICON_MAP[name] ?? null
}
