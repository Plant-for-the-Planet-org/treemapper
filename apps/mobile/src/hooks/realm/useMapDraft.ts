import { useCallback } from 'react'
import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MapDraftData, MapDraftKind } from 'src/types/interface/app.interface'

const makeDraftId = (kind: MapDraftKind, ownerId: string) => `${kind}:${ownerId}`

// Drop every draft belonging to an owner. Takes the realm rather than using the
// hook so callers that already hold one (see useInterventionManagement) can put
// the cleanup inside their own transaction. Must be called within realm.write.
export const deleteDraftsInWrite = (realm: Realm, ownerId: string) => {
  const drafts = realm.objects<MapDraftData>(RealmSchema.MapDraft).filtered('owner_id == $0', ownerId)
  if (drafts.length) {
    realm.delete(drafts)
  }
}

const useMapDraft = () => {
  const realm = useRealm()

  // Every mark and undo lands here, so a crash costs at most the point being
  // tapped. Writing an empty list removes the row instead of leaving a husk
  // that would "restore" nothing on the next visit.
  const saveDraft = useCallback((kind: MapDraftKind, ownerId: string, coordinates: number[][]) => {
    if (!ownerId) {
      return
    }
    try {
      realm.write(() => {
        const draft_id = makeDraftId(kind, ownerId)
        if (!coordinates || coordinates.length === 0) {
          const existing = realm.objectForPrimaryKey<MapDraftData>(RealmSchema.MapDraft, draft_id)
          if (existing) {
            realm.delete(existing)
          }
          return
        }
        realm.create(
          RealmSchema.MapDraft,
          {
            draft_id,
            kind,
            owner_id: ownerId,
            coordinates: JSON.stringify(coordinates),
            updated_at: Date.now(),
          },
          Realm.UpdateMode.Modified,
        )
      })
    } catch (error) {
      console.error('Error while saving map draft:', error)
    }
  }, [realm])

  // Returns fixed-length pairs so the result drops straight into map state and
  // camera calls, which expect [longitude, latitude] tuples.
  const readDraft = useCallback((kind: MapDraftKind, ownerId: string): [number, number][] => {
    if (!ownerId) {
      return []
    }
    try {
      const draft = realm.objectForPrimaryKey<MapDraftData>(RealmSchema.MapDraft, makeDraftId(kind, ownerId))
      if (!draft?.coordinates) {
        return []
      }
      const parsed = JSON.parse(draft.coordinates)
      // A half-written or hand-edited row must not crash the map screen, so
      // anything that is not a list of coordinate pairs is treated as no draft.
      if (!Array.isArray(parsed)) {
        return []
      }
      return parsed
        .filter(c => Array.isArray(c) && c.length >= 2 && c.every(Number.isFinite))
        .map(c => [c[0], c[1]] as [number, number])
    } catch (error) {
      console.error('Error while reading map draft:', error)
      return []
    }
  }, [realm])

  const clearDraft = useCallback((kind: MapDraftKind, ownerId: string) => {
    if (!ownerId) {
      return
    }
    try {
      realm.write(() => {
        const draft = realm.objectForPrimaryKey<MapDraftData>(RealmSchema.MapDraft, makeDraftId(kind, ownerId))
        if (draft) {
          realm.delete(draft)
        }
      })
    } catch (error) {
      console.error('Error while clearing map draft:', error)
    }
  }, [realm])

  // Marking and tracking are two routes to the same boundary, so committing
  // either one has to retire both drafts.
  const clearOwnerDrafts = useCallback((ownerId: string) => {
    if (!ownerId) {
      return
    }
    try {
      realm.write(() => {
        deleteDraftsInWrite(realm, ownerId)
      })
    } catch (error) {
      console.error('Error while clearing map drafts:', error)
    }
  }, [realm])

  return { saveDraft, readDraft, clearDraft, clearOwnerDrafts }
}

export default useMapDraft
