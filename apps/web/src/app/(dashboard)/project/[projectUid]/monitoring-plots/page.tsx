'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import {
  getProjectMonitoringPlots,
  getMonitoringPlotDetail,
  getMonitoringPlotGroups,
  updateMonitoringPlot,
  deleteMonitoringPlot,
  addMonitoringPlotPlants,
  addMonitoringPlotObservations,
} from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import PlotsOverview, { PlotListItem, PlotGroup } from './component/PlotsOverview';
import PlotDetails, { PlotDetail } from './component/PlotDetails';
import EditPlotModal from './component/EditPlotModal';
import DeletePlotModal from './component/DeletePlotModal';
import GroupsManager from './component/GroupsManager';
import TreeEditDialog from './create/components/TreeEditDialog';
import ObservationEditDialog from './create/components/ObservationEditDialog';
import { treeToPlantDto, observationToDto } from './create/utils/buildPayload';
import { DraftObservation, DraftTree } from './create/types';

let addSeq = 0;

const blankTree = (): DraftTree => ({
  id: `add_plant_${Date.now()}_${(addSeq += 1)}`,
  rows: [],
  tag: '',
  speciesName: '',
  scientificSpeciesUid: null,
  speciesMatch: 'pending',
  latitude: null,
  longitude: null,
  plantingDate: null,
  origin: 'planted',
  measurements: [],
  errors: [],
  warnings: [],
});

const blankObservation = (): DraftObservation => ({
  id: `add_obs_${Date.now()}_${(addSeq += 1)}`,
  row: 0,
  type: '',
  observedAt: new Date().toISOString(),
  value: null,
  unit: '',
  errors: [],
});

/** PlotDetail.geometry may be a bare Geometry or a Feature wrapping one; the
 * tree editor only wants a bare Polygon (for the "outside boundary" warning). */
const extractPolygon = (geometry: PlotDetail['geometry']): GeoJSON.Polygon | null => {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') return geometry as GeoJSON.Polygon;
  if (geometry.type === 'Feature' && geometry.geometry?.type === 'Polygon') {
    return geometry.geometry as GeoJSON.Polygon;
  }
  return null;
};

const MonitoringPlotsPage = () => {
  const router = useRouter();
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const { accessToken } = useToken();
  const token = accessToken || '';
  const projectUid = selectedProject?.uid as string | undefined;
  const userRole = selectedProject?.userRole;
  const canManage = ['owner', 'admin'].includes(userRole || '');
  // Creating a plot matches the server's rule for the create endpoint, which
  // allows contributors as well as owners and admins.
  const canCreate = ['owner', 'admin', 'contributor'].includes(userRole || '');

  const [plots, setPlots] = useState<PlotListItem[]>([]);
  const [groups, setGroups] = useState<PlotGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlotDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const [showAddPlant, setShowAddPlant] = useState(false);
  const [newTree, setNewTree] = useState<DraftTree | null>(null);
  const [addingPlant, setAddingPlant] = useState(false);

  const [showAddObservation, setShowAddObservation] = useState(false);
  const [newObservation, setNewObservation] = useState<DraftObservation | null>(null);
  const [addingObservation, setAddingObservation] = useState(false);

  const fetchPlots = async () => {
    if (!projectUid) return;
    setLoading(true);
    try {
      const res = await getProjectMonitoringPlots(token, projectUid);
      setPlots(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error('Could not load plots');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!projectUid) return;
    try {
      const res = await getMonitoringPlotGroups(token, projectUid);
      setGroups(Array.isArray(res?.data) ? res.data : []);
    } catch {
      // groups are non-critical; ignore
    }
  };

  const fetchDetail = async (plotUid: string) => {
    if (!projectUid) return;
    setDetailLoading(true);
    try {
      const res = await getMonitoringPlotDetail(token, projectUid, plotUid);
      if (!res?.data) {
        toast.error('Could not load plot detail');
        return;
      }
      setDetail(res.data);
    } catch {
      toast.error('Could not load plot detail');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (projectUid) {
      fetchPlots();
      fetchGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUid]);

  const handleSelect = (p: PlotListItem) => {
    setSelectedUid(p.uid);
    setDetail(null);
    fetchDetail(p.uid);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  const handleBack = () => {
    setSelectedUid(null);
    setDetail(null);
  };

  const handleSaveEdit = async (payload: Record<string, unknown>) => {
    if (!projectUid || !selectedUid) return;
    setSaving(true);
    try {
      const res = await updateMonitoringPlot(token, projectUid, selectedUid, payload);
      if (!res?.data) {
        toast.error('Could not save changes');
        return;
      }
      setDetail(res.data);
      setPlots((prev) => prev.map((p) =>
        p.uid === selectedUid
          ? { ...p, name: res.data.name, shape: res.data.shape, isComplete: res.data.isComplete }
          : p,
      ));
      // The edit can move the plot between groups, so the group counts on the
      // list view need a re-read.
      if ('groupUid' in payload) fetchGroups();
      setShowEdit(false);
      toast.success('Plot updated');
    } catch {
      toast.error('Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectUid || !selectedUid) return;
    setDeleting(true);
    try {
      const res = await deleteMonitoringPlot(token, projectUid, selectedUid);
      if (!res?.data?.deleted) {
        toast.error('Could not delete plot');
        return;
      }
      setPlots((prev) => prev.filter((p) => p.uid !== selectedUid));
      setShowDelete(false);
      toast.success('Plot deleted');
      handleBack();
      fetchGroups();
    } catch {
      toast.error('Could not delete plot');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPlant = async (tree: DraftTree): Promise<boolean | void> => {
    if (!projectUid || !selectedUid) return false;
    setAddingPlant(true);
    try {
      const res = await addMonitoringPlotPlants(token, projectUid, {
        plotUid: selectedUid,
        plants: [treeToPlantDto(tree)],
      });
      if (!res?.data) {
        toast.error('Could not add plant');
        return false;
      }
      toast.success('Plant added');
      fetchDetail(selectedUid);
      fetchPlots();
    } catch {
      toast.error('Could not add plant');
      return false;
    } finally {
      setAddingPlant(false);
    }
  };

  const handleAddObservation = async (observation: DraftObservation): Promise<boolean | void> => {
    if (!projectUid || !selectedUid) return false;
    setAddingObservation(true);
    try {
      const res = await addMonitoringPlotObservations(token, projectUid, {
        plotUid: selectedUid,
        observations: [observationToDto(observation)],
      });
      if (!res?.data) {
        toast.error('Could not add observation');
        return false;
      }
      toast.success('Observation added');
      fetchDetail(selectedUid);
    } catch {
      toast.error('Could not add observation');
      return false;
    } finally {
      setAddingObservation(false);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto bg-muted/30">
      <div className="p-4 sm:p-6">
        {selectedUid ? (
          <div className="max-w-[1280px] mx-auto">
            <PlotDetails
              plot={detail}
              loading={detailLoading}
              onBack={handleBack}
              onEdit={() => setShowEdit(true)}
              onDelete={() => setShowDelete(true)}
              canManage={canManage}
              canCreate={canCreate}
              onAddPlant={() => { setNewTree(blankTree()); setShowAddPlant(true); }}
              onAddObservation={() => { setNewObservation(blankObservation()); setShowAddObservation(true); }}
            />
          </div>
        ) : (
          <PlotsOverview
            plots={plots}
            groups={groups}
            loading={loading}
            onSelect={handleSelect}
            canManage={canManage}
            canCreate={canCreate}
            onManageGroups={() => setShowGroups(true)}
            onCreatePlot={() => router.push(`/project/${projectUid}/monitoring-plots/create`)}
          />
        )}
      </div>

      <EditPlotModal
        open={showEdit}
        plot={detail}
        groups={groups}
        saving={saving}
        onClose={() => setShowEdit(false)}
        onSave={handleSaveEdit}
      />
      <DeletePlotModal
        open={showDelete}
        plotName={detail?.name || ''}
        deleting={deleting}
        onClose={() => setShowDelete(false)}
        onConfirm={handleConfirmDelete}
      />
      <GroupsManager
        open={showGroups}
        onClose={() => setShowGroups(false)}
        token={token}
        projectUid={projectUid || ''}
        plots={plots}
        groups={groups}
        onChanged={fetchGroups}
      />
      <TreeEditDialog
        open={showAddPlant}
        tree={newTree}
        token={token}
        boundary={extractPolygon(detail?.geometry ?? null)}
        title="Add plant"
        saving={addingPlant}
        onClose={() => setShowAddPlant(false)}
        onSave={handleAddPlant}
      />
      <ObservationEditDialog
        open={showAddObservation}
        observation={newObservation}
        title="Add observation"
        saving={addingObservation}
        onClose={() => setShowAddObservation(false)}
        onSave={handleAddObservation}
      />
    </div>
  );
};

export default MonitoringPlotsPage;
