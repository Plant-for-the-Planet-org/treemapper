import React, { useEffect, useState } from 'react';
import { Leaf, Sprout, Map, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getDashboardKpis } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import { useAnalyticsStore } from '@shared-core/store/useAnalyticsStore'
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  changePercent: number;
  vf: string;
  sparkData: { v: number }[];
  loading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, changePercent, vf, sparkData, loading = false }: StatCardProps) => {
  if (loading) return <ShimmerCard />;

  const isPositive = vf !== 'decrease';
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? 'text-[#007A49]' : 'text-red-600';
  const changeBg = isPositive ? 'bg-green-50' : 'bg-red-50';
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

        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${changeBg} flex-shrink-0`}>
            <ChangeIcon size={12} className={changeColor} />
            <span className={`text-xs font-medium ${changeColor}`}>
              {Math.floor(Math.abs(changePercent))}% <span className="opacity-60">12m</span>
            </span>
          </div>
          <div className="flex-1 h-7">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
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
  sparkData: { v: number }[];
}

const emptySpark = Array.from({ length: 12 }, () => ({ v: 0 }));

const StatCardsContainer = ({ setTotalTrees }: { setTotalTrees: (n: number) => void }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StatItem[]>([
    { title: 'Trees Planted', value: '0', changePercent: 0, vf: '', icon: Leaf, sparkData: emptySpark },
    { title: 'Species Planted', value: '0', changePercent: 0, vf: '', icon: Sprout, sparkData: emptySpark },
    { title: 'Area Covered', value: '0 ha', changePercent: 0, vf: '', icon: Map, sparkData: emptySpark },
    { title: 'Field Data Collectors', value: '0', changePercent: 0, vf: '', icon: Activity, sparkData: emptySpark },
  ]);

  const selectedProject = useProjectStore(state => state.selectedProject);
  const { startDate, endDate } = useAnalyticsStore(state => state);
  const { accessToken } = useToken();

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedProject]);

  const parseChange = (change: { value: string | number; type: string }): { changePercent: number; vf: string } => {
    const { value, type } = change ?? {};
    if (type === 'no_change' || value === null || value === undefined) return { changePercent: 0, vf: '' };
    const num = Number(value);
    if (isNaN(num) || num === 0) return { changePercent: 0, vf: '' };
    return { changePercent: num, vf: type };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getDashboardKpis(accessToken || '', selectedProject?.uid || '');

      if (response?.statusCode === 200 && response.data) {
        const {
          totalTreesPlanted, totalAreaCovered, totalSpeciesPlanted, totalContributors,
          totalTreesPlantedChange, totalAreaCoveredChange, totalSpeciesPlantedChange, totalContributorsChange,
          monthlyHistory = [],
        } = response.data.kpis;

        if (totalTreesPlanted) setTotalTrees(totalTreesPlanted);

        const toSpark = (key: 'trees' | 'species' | 'area' | 'contributors') =>
          monthlyHistory.length
            ? monthlyHistory.map((m: any) => ({ v: Number(m[key] ?? 0) }))
            : emptySpark;

        setOverview([
          { title: 'Trees Planted', value: formatNumber(Number(totalTreesPlanted)), ...parseChange(totalTreesPlantedChange), icon: Leaf, sparkData: toSpark('trees') },
          { title: 'Species Planted', value: totalSpeciesPlanted, ...parseChange(totalSpeciesPlantedChange), icon: Sprout, sparkData: toSpark('species') },
          { title: 'Area Covered', value: `${formatNumber(Number(totalAreaCovered))} ha`, ...parseChange(totalAreaCoveredChange), icon: Map, sparkData: toSpark('area') },
          { title: 'Field Data Collectors', value: totalContributors, ...parseChange(totalContributorsChange), icon: Activity, sparkData: toSpark('contributors') },
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 pt-3 pb-2">
      <div className="flex gap-3 overflow-x-auto md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ShimmerCard key={i} />)
          : overview.map((stat, i) => (
            <div key={i} className="flex-shrink-0 md:flex-1">
              <StatCard
                title={stat.title}
                value={stat.value}
                changePercent={stat.changePercent}
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
