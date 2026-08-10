import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Leaf, Sprout, Map, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { getDashboardKpis } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import { useAnalyticsStore } from '@shared-core/store/useAnalyticsStore'
import usePolling from '@/hooks/usePolling'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper';
import { Card, CardContent } from '@/components/ui/card';

const ShimmerCard = () => (
  <Card className="flex-shrink-0 min-w-[160px] w-full animate-pulse py-0">
    <CardContent className="px-3 py-2.5">
      <div className="flex justify-between items-start mb-2">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-4 w-4 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-7 bg-gray-200 rounded w-full"></div>
    </CardContent>
  </Card>
);

const formatMonth = (yyyyMM: string) => {
  const [year, month] = yyyyMM.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const SparkTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { v, month } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow-sm pointer-events-none">
      {month && <p className="text-gray-400">{formatMonth(month)}</p>}
      <p className="font-semibold text-gray-900">{formatNumber(v)}</p>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  vf: string;
  sparkData: { v: number; month?: string }[];
  loading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, vf, sparkData, loading = false }: StatCardProps) => {
  if (loading) return <ShimmerCard />;

  const isPositive = vf !== 'decrease';
  const sparkColor = isPositive ? '#007A49' : '#dc2626';

  return (
    <Card className="flex-shrink-0 min-w-[160px] w-full hover:shadow-md transition-shadow duration-200 py-0">
      <CardContent className="px-3 py-2.5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-medium text-gray-500 leading-tight">{title}</h3>
          <div className="bg-green-50 p-1.5 rounded-xl">
            <Icon size={16} className="text-[#007A49]" />
          </div>
        </div>

        <p className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{value}</p>

        <div className="space-y-0.5">
          <div className="w-full">
            {/* Height is passed as a number, not "100%": recharts only learns a
                percentage height after its ResizeObserver fires, so the first
                render would warn about a -1 height. */}
            <ResponsiveContainer width="100%" height={28}>
              <LineChart data={sparkData}>
                <Tooltip content={<SparkTooltip />} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] text-gray-400">12-month trend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatItem {
  title: string;
  value: string | number;
  changePercent: number;
  vf: string;
  icon: React.ElementType;
  sparkData: { v: number; month?: string }[];
}

const emptySpark = Array.from({ length: 12 }, () => ({ v: 0 }));

const StatCardsContainer = ({ setTotalTrees }: { setTotalTrees: (n: number) => void }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StatItem[]>([
    { title: 'Trees Planted', value: '0', changePercent: 0, vf: '', icon: Leaf, sparkData: emptySpark },
    { title: 'Species Planted', value: '0', changePercent: 0, vf: '', icon: Sprout, sparkData: emptySpark },
    { title: 'Restoration Area', value: '0 ha', changePercent: 0, vf: '', icon: Map, sparkData: emptySpark },
    { title: 'Active Contributors', value: '0', changePercent: 0, vf: '', icon: Activity, sparkData: emptySpark },
  ]);

  const selectedProject = useProjectStore(state => state.selectedProject);
  const { startDate, endDate } = useAnalyticsStore(state => state);
  const { accessToken } = useToken();

  // Last seen tree count, used to detect new trees between polls. `null` means
  // "no baseline yet" so the first load (and a project/date switch) never
  // toasts — only a genuine increase on a later poll does.
  const prevTreesRef = useRef<number | null>(null);

  useEffect(() => {
    // New project or date range: re-baseline so the change itself is not
    // mistaken for newly planted trees.
    prevTreesRef.current = null;
    fetchData();
  }, [startDate, endDate, selectedProject]);

  const parseChange = (change: { value: string | number; type: string }): { changePercent: number; vf: string } => {
    const { value, type } = change ?? {};
    if (type === 'no_change' || value === null || value === undefined) return { changePercent: 0, vf: '' };
    // Brand-new metric: prev-year total was 0, so a percentage is meaningless.
    // The server sends value "New"; surface it as a "New" badge, not 0%.
    if (type === 'new') return { changePercent: 0, vf: 'new' };
    const num = Number(value);
    if (isNaN(num) || num === 0) return { changePercent: 0, vf: '' };
    return { changePercent: num, vf: type };
  };

  // `silent` skips the shimmer so background polls refresh the numbers in
  // place without flashing the loading state.
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getDashboardKpis(accessToken || '', selectedProject?.uid || '');

      if (response?.statusCode === 200 && response.data) {
        const {
          totalTreesPlanted, totalAreaCovered, totalSpeciesPlanted, totalContributors,
          totalTreesPlantedChange, totalAreaCoveredChange, totalSpeciesPlantedChange, totalContributorsChange,
          monthlyHistory = [],
        } = response.data.kpis;

        if (totalTreesPlanted) setTotalTrees(totalTreesPlanted);

        // Toast when the tree count grows since the last poll, so users see new
        // field uploads without refreshing. Slides in from the top-right.
        if (totalTreesPlanted != null) {
          const newCount = Number(totalTreesPlanted) || 0;
          if (prevTreesRef.current !== null && newCount > prevTreesRef.current) {
            const added = newCount - prevTreesRef.current;
            toast.success(`🌳 ${added.toLocaleString()} new ${added === 1 ? 'tree' : 'trees'} added`);
          }
          prevTreesRef.current = newCount;
        }

        const toSpark = (key: 'trees' | 'species' | 'area' | 'contributors') =>
          monthlyHistory.length
            ? monthlyHistory.map((m: any) => ({ v: Number(m[key] ?? 0), month: m.month }))
            : emptySpark;

        setOverview([
          { title: 'Trees Planted', value: formatNumber(Number(totalTreesPlanted)), ...parseChange(totalTreesPlantedChange), icon: Leaf, sparkData: toSpark('trees') },
          { title: 'Species Planted', value: totalSpeciesPlanted, ...parseChange(totalSpeciesPlantedChange), icon: Sprout, sparkData: toSpark('species') },
          { title: 'Restoration Area', value: `${formatNumber(Number(totalAreaCovered))} ha`, ...parseChange(totalAreaCoveredChange), icon: Map, sparkData: toSpark('area') },
          { title: 'Active Contributors', value: totalContributors, ...parseChange(totalContributorsChange), icon: Activity, sparkData: toSpark('contributors') },
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto-refresh the KPI cards every 30s so uploads from the field show up
  // without a manual page refresh. Silent: no shimmer between ticks.
  usePolling(() => fetchData(true), 30_000, !!selectedProject?.uid);

  return (
    <div className="w-full md:px-4 md:pt-3 md:pb-2">
      <div className="flex gap-3 px-4 py-3 overflow-x-auto md:p-0 md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ShimmerCard key={i} />)
          : overview.map((stat, i) => (
            <div key={i} className="flex-shrink-0 md:flex-1">
              <StatCard
                title={stat.title}
                value={stat.value}
                vf={stat.vf}
                icon={stat.icon}
                sparkData={stat.sparkData}
              />
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default StatCardsContainer;
