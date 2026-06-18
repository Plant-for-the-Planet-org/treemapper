'use client';

import { useEffect, useMemo, useState } from 'react';
import { Grid2x2 } from 'lucide-react';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import {
  getProjectMonitoringPlots,
  getMonitoringPlotDetail,
  getMonitoringPlotGroups,
  updateMonitoringPlot,
  deleteMonitoringPlot,
} from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import MonitoringPlotsPanel, { PlotListItem, PlotGroup } from './component/MonitoringPlotsPanel';
import PlotDetails, { PlotDetail } from './component/PlotDetails';
import EditPlotModal from './component/EditPlotModal';
import DeletePlotModal from './component/DeletePlotModal';
import GroupsManager from './component/GroupsManager';

const MonitoringPlotsPage = () => {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const { accessToken } = useToken();
  const token = accessToken || '';
  const projectUid = selectedProject?.uid as string | undefined;
  const userRole = selectedProject?.userRole;
  const canManage = ['owner', 'admin'].includes(userRole || '');

  const [plots, setPlots] = useState<PlotListItem[]>([]);
  const [groups, setGroups] = useState<PlotGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlotDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const fetchPlots = async (autoSelect = true) => {
    if (!projectUid) return;
    setLoading(true);
    try {
      const res = await getProjectMonitoringPlots(token, projectUid);
      const data: PlotListItem[] = Array.isArray(res?.data) ? res.data : [];
      setPlots(data);
      if (autoSelect && data.length > 0) {
        handleSelect(data[0], false);
      } else if (data.length === 0) {
        setSelectedUid(null);
        setDetail(null);
      }
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

  const handleSelect = (p: PlotListItem, switchMobile = true) => {
    setSelectedUid(p.uid);
    fetchDetail(p.uid);
    if (switchMobile) setMobileView('detail');
  };

  // uids that belong to at least one group
  const groupedUids = useMemo(() => {
    const s = new Set<string>();
    groups.forEach((g) => g.plots.forEach((p) => s.add(p.uid)));
    return s;
  }, [groups]);

  const filteredPlots = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const groupSet =
      groupFilter !== 'all' && groupFilter !== 'ungrouped'
        ? new Set(groups.find((g) => g.uid === groupFilter)?.plots.map((p) => p.uid) || [])
        : null;

    return plots.filter((p) => {
      const matchesSearch =
        !term ||
        (p.name || '').toLowerCase().includes(term) ||
        p.hid.toLowerCase().includes(term);
      const matchesGroup =
        groupFilter === 'all'
          ? true
          : groupFilter === 'ungrouped'
            ? !groupedUids.has(p.uid)
            : groupSet?.has(p.uid);
      return matchesSearch && matchesGroup;
    });
  }, [plots, searchTerm, groupFilter, groups, groupedUids]);

  const handleSaveEdit = async (payload: any) => {
    if (!projectUid || !selectedUid) return;
    setSaving(true);
    try {
      const res = await updateMonitoringPlot(token, projectUid, selectedUid, payload);
      if (!res?.data) {
        toast.error('Could not save changes');
        return;
      }
      setDetail(res.data);
      // reflect name/shape/complete in the list without a full refetch
      setPlots((prev) => prev.map((p) =>
        p.uid === selectedUid
          ? { ...p, name: res.data.name, shape: res.data.shape, isComplete: res.data.isComplete }
          : p,
      ));
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
      const remaining = plots.filter((p) => p.uid !== selectedUid);
      setPlots(remaining);
      setShowDelete(false);
      toast.success('Plot deleted');
      if (remaining.length > 0) {
        handleSelect(remaining[0], false);
      } else {
        setSelectedUid(null);
        setDetail(null);
        setMobileView('list');
      }
      fetchGroups();
    } catch {
      toast.error('Could not delete plot');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 flex overflow-hidden bg-muted/30">
      {/* List */}
      <div className={`w-full md:w-[300px] lg:w-[340px] flex-shrink-0 h-full ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'} flex-col`}>
        <MonitoringPlotsPanel
          filteredPlots={filteredPlots}
          selectedUid={selectedUid}
          onSelect={(p) => handleSelect(p)}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          groups={groups}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          onManageGroups={() => setShowGroups(true)}
          canManage={canManage}
        />
      </div>

      {/* Detail */}
      <div className={`flex-1 h-full overflow-y-auto p-4 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
        {selectedUid ? (
          <PlotDetails
            plot={detail}
            loading={detailLoading}
            onBack={() => setMobileView('list')}
            onEdit={() => setShowEdit(true)}
            onDelete={() => setShowDelete(true)}
            canManage={canManage}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <Grid2x2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{loading ? 'Loading plots…' : 'Select a plot to view its details'}</p>
          </div>
        )}
      </div>

      <EditPlotModal
        open={showEdit}
        plot={detail}
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
    </div>
  );
};

export default MonitoringPlotsPage;
