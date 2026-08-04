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
} from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import PlotsOverview, { PlotListItem, PlotGroup } from './component/PlotsOverview';
import PlotDetails, { PlotDetail } from './component/PlotDetails';
import EditPlotModal from './component/EditPlotModal';
import DeletePlotModal from './component/DeletePlotModal';
import GroupsManager from './component/GroupsManager';

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
    </div>
  );
};

export default MonitoringPlotsPage;
