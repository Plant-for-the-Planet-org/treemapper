import { Save, X, Edit3, MapPin, Calendar, Clock, FileText, UsersRound, LandPlot, User, Plus, ChevronLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import SiteViewer from '@/component/DisplayGeoJSONMap'
import GeoJSONUpload from '@/component/GeoJSONfileupload'

const formatDate = (d?: string) => {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMMM d, yyyy') } catch { return d }
}

const formatArea = (area?: string) => {
  if (!area || area === 'Not available') return '—'
  const m = area.match(/([\d,.]+)/)
  if (!m) return area
  const num = parseFloat(m[1].replace(/,/g, ''))
  if (isNaN(num)) return area
  return `${num.toLocaleString('en-US', { maximumFractionDigits: 1 })} ha`
}

const initials = (name?: string) =>
  name ? name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?'

const InfoRow = ({ icon: Icon, label, value, sub }: any) => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
      <Icon size={14} className="text-muted-foreground" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
      <div className="text-xs text-foreground truncate">{value || '—'}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60 truncate">{sub}</div>}
    </div>
  </div>
)

export const SiteDetails = ({
  site, isEditing, editedSite, setEditedSite, onEdit, onSave, onCancel, setSiteAccessModal, onBack,
  onSyncToTtc, isSyncingTtc, canSyncTtc,
}: any) => {
  const needsTtcSync = !site.remoteId || site.remoteSyncStatus === 'failed'
  const members = site.member?.avatars || []
  const totalMembers = site.member?.totalCount || 0
  const visibleMembers = members.slice(0, 5)
  const remaining = Math.max(0, totalMembers - visibleMembers.length)

  return (
    <Card className="py-0 gap-0 overflow-hidden">
      {/* Mobile back button */}
      {onBack && (
        <div className="md:hidden px-3 pt-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground -ml-1">
            <ChevronLeft size={16} />
            Sites
          </Button>
        </div>
      )}
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        {isEditing ? (
          <div>
            <Textarea
              value={editedSite?.name || ''}
              onChange={(e) => setEditedSite({ ...editedSite, name: e.target.value })}
              placeholder="Site name..."
              maxLength={40}
              rows={1}
              className="text-lg font-semibold resize-none min-h-9 leading-tight [field-sizing:content]"
            />
            <div className="text-[10px] text-muted-foreground/60 mt-1 text-right">
              {(editedSite?.name?.length || 0)}/40
            </div>
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-foreground break-words">{site.name}</h2>
        )}
        <div className={cn('flex items-center justify-between gap-3', isEditing ? 'mt-3' : 'mt-1')}>
          {!isEditing && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LandPlot size={14} className="text-muted-foreground/60" />
              <span className="font-medium">{formatArea(site.area)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={onCancel} className="h-8 gap-1.5">
                  <X size={14} />
                  Cancel
                </Button>
                <Button size="sm" onClick={onSave} className="h-8 gap-1.5 bg-primary hover:bg-primary/90">
                  <Save size={14} />
                  Save
                </Button>
              </>
            ) : (
              <>
                {canSyncTtc && (
                  needsTtcSync ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onSyncToTtc}
                      disabled={isSyncingTtc}
                      className="h-7 gap-1.5 text-xs"
                      title="Sync this site to the Plant-for-the-Planet (TTC) backend"
                    >
                      <RefreshCw size={14} className={cn(isSyncingTtc && 'animate-spin')} />
                      {isSyncingTtc ? 'Syncing' : 'Sync to Platform'}
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70" title="Synced to the Plant-for-the-Planet (TTC) backend">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Synced
                    </span>
                  )
                )}
                <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 -mr-2 gap-1.5 text-muted-foreground hover:text-foreground">
                  <Edit3 size={14} />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Map hero */}
        {/* TODO: switch to dark map style in dark mode */}
        <div className="h-72 bg-muted/50 border-b border-border/50">
          <SiteViewer geoJsonData={isEditing && editedSite?.geometry ? editedSite.geometry : site.geometry} />
        </div>
        {isEditing && (
          <div className="p-5 border-b border-border/50">
            <GeoJSONUpload
              onGeoJSONChange={(geoJson: any) => {
                if (geoJson) setEditedSite((prev: any) => ({ ...prev, geometry: geoJson }))
              }}
              allowedGeometryTypes={['Polygon']}
              maxAreaHa={10000}
              className="w-full"
            />
          </div>
        )}

        {/* Description */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={14} className="text-muted-foreground/60" />
            <h3 className="text-xs font-medium text-foreground/80 uppercase tracking-wide">Description</h3>
          </div>
          {isEditing ? (
            <Textarea
              value={editedSite?.description || ''}
              onChange={(e) => setEditedSite({ ...editedSite, description: e.target.value })}
              rows={4}
              placeholder="Enter site description..."
              className="resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {site.description || <span className="text-muted-foreground/60 italic">No description provided</span>}
            </p>
          )}
        </div>

        {/* Access */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <UsersRound size={14} className="text-muted-foreground/60" />
              <h3 className="text-xs font-medium text-foreground/80 uppercase tracking-wide">
                Access {totalMembers > 0 && <span className="text-muted-foreground/60 normal-case font-normal ml-1">({totalMembers})</span>}
              </h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSiteAccessModal(true)} className="h-7 gap-1 text-xs text-primary hover:text-primary/90 hover:bg-primary/10">
              <Plus size={14} />
              Manage
            </Button>
          </div>
          {totalMembers > 0 ? (
            <div className="space-y-2">
              <AvatarGroup>
                {visibleMembers.map((m: any) => (
                  <Avatar key={m.uid} size="sm" title={m.displayName} className="bg-background">
                    <AvatarImage src={m.image} alt={m.displayName} />
                    <AvatarFallback>{initials(m.displayName)}</AvatarFallback>
                  </Avatar>
                ))}
                {remaining > 0 && <AvatarGroupCount size="sm">+{remaining}</AvatarGroupCount>}
              </AvatarGroup>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {visibleMembers.map((m: any) => m.displayName).filter(Boolean).join(', ')}
                {remaining > 0 && ` and ${remaining} more`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60">No team members assigned yet</p>
          )}
        </div>

        {/* Meta info */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoRow icon={User} label="Created by" value={site.createdBy} />
          <InfoRow icon={Calendar} label="Created" value={formatDate(site.createdAt)} />
          <InfoRow icon={Clock} label="Updated" value={formatDate(site.lastUpdate)} />
        </div>
      </CardContent>
    </Card>
  )
}
