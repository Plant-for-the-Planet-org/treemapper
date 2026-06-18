import { Leaf, HelpCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cdnUrl } from '@/lib/cdn'
import { cn } from '@/lib/utils'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper'

interface SidebarProps {
  unknownSpecies: any[]
  topPlanted: any[]
  selectedUnknown: string[]
  onToggleUnknown: (uid: string) => void
  onAssign: () => void
  onClear: () => void
  onSelectSpecies: (species: any) => void
}

const Panel = ({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string
  count?: number
  icon: React.ElementType
  children: React.ReactNode
}) => (
  <Card className="py-0 gap-0">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {count != null && (
        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    {children}
  </Card>
)

export const SpeciesSidebar = ({
  unknownSpecies,
  topPlanted,
  selectedUnknown,
  onToggleUnknown,
  onAssign,
  onClear,
  onSelectSpecies,
}: SidebarProps) => {
  const hasSelection = selectedUnknown.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Unknown species — needs identification */}
      <Panel title="Unknown species" count={unknownSpecies.length} icon={HelpCircle}>
        <p className="px-4 pt-2.5 text-[11px] text-muted-foreground">Needs identification</p>
        {unknownSpecies.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Nothing to review
          </p>
        ) : (
          <>
            <ScrollArea className="max-h-72">
              <div className="px-2 py-2 space-y-0.5">
                {unknownSpecies.map((s) => {
                  const checked = selectedUnknown.includes(s.uid)
                  const count = s.totalCount || s.count || s.speciesCount || 0
                  return (
                    <div
                      key={s.uid}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors cursor-pointer',
                        checked ? 'bg-primary/5' : 'hover:bg-muted/60'
                      )}
                      onClick={() => onToggleUnknown(s.uid)}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggleUnknown(s.uid)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {s.speciesName || s.scientificName || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {s.interventionHid ? `Intervention ${s.interventionHid}` : 'From intervention'}
                        </p>
                      </div>
                      {count > 0 && (
                        <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">
                          {formatNumber(count)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 text-xs"
                disabled={!hasSelection}
                onClick={onClear}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="h-8 flex-1 text-xs"
                disabled={!hasSelection}
                onClick={onAssign}
              >
                Assign{hasSelection ? ` (${selectedUnknown.length})` : ''}
              </Button>
            </div>
          </>
        )}
      </Panel>

      {/* Most planted — Top 10 */}
      <Panel title="Most planted" count={topPlanted.length} icon={TrendingUp}>
        <p className="px-4 pt-2.5 text-[11px] text-muted-foreground">Top 10 by trees</p>
        {topPlanted.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No species yet</p>
        ) : (
          <div className="px-2 py-2 space-y-0.5">
            {topPlanted.map((s, i) => {
              const count = s.totalCount || s.count || 0
              return (
                <button
                  key={s.uid}
                  type="button"
                  onClick={() => onSelectSpecies(s)}
                  className="w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors text-left"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground w-4 flex-shrink-0 text-center">
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 bg-muted/40 rounded overflow-hidden flex-shrink-0">
                    {s.image ? (
                      <img
                        src={cdnUrl('species', s.image) ?? ''}
                        alt={s.commonName || s.scientificName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf size={12} className="text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground italic truncate flex-1 min-w-0">
                    {s.scientificName || s.speciesName}
                  </span>
                  <span className="text-xs font-semibold text-foreground flex-shrink-0">
                    {formatNumber(count)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
