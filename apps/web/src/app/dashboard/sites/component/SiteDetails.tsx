import { Save, X, Edit3, MapPin, Calendar, Clock, FileText, UsersRound, LandPlot, User, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import SiteViewer from '@/component/DisplayGeoJSONMap'
import GeoJSONUpload from '@/component/GeoJSONfileupload'

const AVATAR_BG = [
  'bg-[#e6f1ec] text-[#007A49]',
  'bg-amber-50 text-amber-700',
  'bg-gray-100 text-gray-700',
]

const initials = (name?: string) =>
  name ? name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?'

const colorFor = (name?: string) => {
  if (!name) return AVATAR_BG[0]
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return AVATAR_BG[hash % AVATAR_BG.length]
}

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

const Avatar = ({ name, image, size = 24 }: { name?: string; image?: string; size?: number }) => (
  <div
    className="rounded-full overflow-hidden border-2 border-white flex-shrink-0"
    style={{ width: size, height: size }}
    title={name}
  >
    {image ? (
      <img src={image} alt={name || ''} className="w-full h-full object-cover" />
    ) : (
      <div className={cn('w-full h-full flex items-center justify-center text-[10px] font-medium', colorFor(name))}>
        {initials(name)}
      </div>
    )}
  </div>
)

const InfoRow = ({ icon: Icon, label, value, sub }: any) => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon size={14} className="text-gray-500" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
      <div className="text-xs text-gray-900 truncate">{value || '—'}</div>
      {sub && <div className="text-[10px] text-gray-400 truncate">{sub}</div>}
    </div>
  </div>
)

export const SiteDetails = ({
  site, isEditing, editedSite, setEditedSite, onEdit, onSave, onCancel, setSiteAccessModal,
}: any) => {
  const members = site.member?.avatars || []
  const totalMembers = site.member?.totalCount || 0
  const visibleMembers = members.slice(0, 5)
  const remaining = Math.max(0, totalMembers - visibleMembers.length)

  return (
    <Card className="py-0 gap-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
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
            <div className="text-[10px] text-gray-400 mt-1 text-right">
              {(editedSite?.name?.length || 0)}/40
            </div>
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-gray-900 break-words">{site.name}</h2>
        )}
        <div className={cn('flex items-center justify-between gap-3', isEditing ? 'mt-3' : 'mt-1')}>
          {!isEditing && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <LandPlot size={14} className="text-gray-400" />
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
                <Button size="sm" onClick={onSave} className="h-8 gap-1.5 bg-[#007A49] hover:bg-[#006040]">
                  <Save size={14} />
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 -mr-2 gap-1.5 text-gray-500 hover:text-gray-900">
                <Edit3 size={14} />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Map hero */}
        <div className="h-72 bg-gray-50 border-b border-gray-100">
          <SiteViewer geoJsonData={isEditing && editedSite?.geometry ? editedSite.geometry : site.geometry} />
        </div>
        {isEditing && (
          <div className="p-5 border-b border-gray-100">
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
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={14} className="text-gray-400" />
            <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Description</h3>
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
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {site.description || <span className="text-gray-400 italic">No description provided</span>}
            </p>
          )}
        </div>

        {/* Access */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <UsersRound size={14} className="text-gray-400" />
              <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Access {totalMembers > 0 && <span className="text-gray-400 normal-case font-normal ml-1">({totalMembers})</span>}
              </h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSiteAccessModal(true)} className="h-7 gap-1 text-xs text-[#007A49] hover:text-[#006040] hover:bg-[#e6f1ec]">
              <Plus size={14} />
              Manage
            </Button>
          </div>
          {totalMembers > 0 ? (
            <div className="space-y-2">
              {/* Stacked preview */}
              <div className="flex items-center -space-x-2">
                {visibleMembers.map((m: any) => (
                  <Avatar key={m.uid} name={m.displayName} image={m.image} size={28} />
                ))}
                {remaining > 0 && (
                  <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-gray-600">+{remaining}</span>
                  </div>
                )}
              </div>
              {/* Names */}
              <p className="text-xs text-gray-500 leading-relaxed">
                {visibleMembers.map((m: any) => m.displayName).filter(Boolean).join(', ')}
                {remaining > 0 && ` and ${remaining} more`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No team members assigned yet</p>
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
