'use client';

import { Search, Grid2x2, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type PlotListItem = {
  uid: string;
  hid: string;
  name: string | null;
  totalTreeCount: number | null;
  shape: string | null;
  isComplete: boolean | null;
  createdAt: string | null;
};

export type PlotGroup = {
  uid: string;
  name: string;
  plots: { uid: string; hid: string; name: string | null }[];
};

const MonitoringPlotsPanel = ({
  filteredPlots,
  selectedUid,
  onSelect,
  loading,
  searchTerm,
  setSearchTerm,
  groups,
  groupFilter,
  setGroupFilter,
  onManageGroups,
  canManage,
}: {
  filteredPlots: PlotListItem[];
  selectedUid: string | null;
  onSelect: (p: PlotListItem) => void;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  groups: PlotGroup[];
  groupFilter: string;
  setGroupFilter: (v: string) => void;
  onManageGroups: () => void;
  canManage: boolean;
}) => {
  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-3 border-b space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Plots</h2>
          {canManage && (
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onManageGroups}>
              <Layers className="w-3.5 h-3.5 mr-1" /> Groups
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plots"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            <SelectItem value="ungrouped">Ungrouped</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.uid} value={g.uid}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filteredPlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <Grid2x2 className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No plots found</p>
          </div>
        ) : (
          <ul className="divide-y">
            {filteredPlots.map((p) => (
              <li key={p.uid}>
                <button
                  onClick={() => onSelect(p)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors',
                    selectedUid === p.uid && 'bg-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{p.name || 'Unnamed plot'}</span>
                    {p.isComplete ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Complete</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">{p.hid}</span>
                    <span>·</span>
                    <span>{p.totalTreeCount ?? 0} trees</span>
                    {p.shape && <><span>·</span><span className="capitalize">{p.shape}</span></>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-3 py-2 border-t text-xs text-muted-foreground">
        {filteredPlots.length} plot{filteredPlots.length === 1 ? '' : 's'}
      </div>
    </div>
  );
};

export default MonitoringPlotsPanel;
