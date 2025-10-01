import React, { useEffect, useState } from 'react';
import { Leaf, Sprout, Map, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { getDashboardKpis } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import { useAnalyticsStore } from '@shared-core/store/useAnalyticsStore'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper';

// Shimmer Loading Component
const ShimmerCard = () => {
  return (
    <div className="flex-shrink-0 rounded-xl border border-gray-200 p-4 shadow-sm bg-white min-w-[240px] w-full animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-5 w-5 bg-gray-200 rounded"></div>
      </div>
      <div className="h-7 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  );
};

const StatCard = ({ title, value, note, icon: Icon, changePercent, loading = false, vf }) => {
  if (loading) {
    return <ShimmerCard />;
  }
  console.log("RTYUI", vf)
  const isPositive = vf === 'decrease' ? false : true
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="flex-shrink-0 rounded-xl border border-gray-200 p-4 shadow-sm bg-white min-w-[240px] w-full hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-700 leading-tight">{title}</h3>
        <div className="bg-gray-50 p-1.5 rounded-lg">
          <Icon size={16} className="text-gray-500" />
        </div>
      </div>

      <p className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{value}</p>

      {/* Change indicator */}
      <div className="flex items-center gap-1">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${changeBgColor}`}>
          <ChangeIcon size={10} className={changeColor} />
          <span className={`text-xs font-medium ${changeColor}`}>
            {Math.floor(changePercent)}%
          </span>
        </div>
        <span className="text-xs text-gray-500">vs last month</span>
      </div>
    </div>
  );
};

const StatCardsContainer = ({ setTotalTrees }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState([
    {
      title: "Trees Planted",
      value: "0",
      changePercent: 0,
      icon: Leaf,
      vf: ''
    },
    {
      title: "Species Planted",
      value: "0",
      changePercent: 0,
      icon: Sprout,
      vf: ''
    },
    {
      title: "Area Covered",
      value: "0 ha",
      changePercent: 0,
      icon: Map,
      vf: ''
    },
    {
      title: "Field Data Collectors",
      value: "0",
      changePercent: 0,
      icon: Activity,
      vf: ''
    }
  ]);

  const selectedProject = useProjectStore(state => state.selectedProject);
  const { startDate, endDate } = useAnalyticsStore(state => state);
  const { accessToken } = useToken();

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedProject]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getDashboardKpis(accessToken || '', selectedProject?.uid || '');
      console.log("Dashboard KPIs response", response);

      if (response && response.statusCode === 200 && response.data) {
        const { totalTreesPlanted, totalAreaCovered, totalSpeciesPlanted, totalContributors, totalTreesPlantedChange, totalAreaCoveredChange, totalSpeciesPlantedChange, totalContributorsChange } = response.data.kpis;

        if (totalTreesPlanted) {
          setTotalTrees(totalTreesPlanted);
        }

        // Generate dummy change percentages for demo
        // In real implementation, you'd get these from your API
        const generateChangePercent = ({ value, type }) => {
          console.log("UOIP",type)
          let p = 0
          if (type === 'no_change') {
            p = 0
          }

          if (value === null) {
            p = 0
          }

          if (!Number(value)) {
            return { vf:'', value:0 }
          }

          return { vf: p === 0 ? '' : type, value }
        }
        console.log("CVBHJK<", generateChangePercent(totalTreesPlantedChange).value)
        setOverview([
          {
            title: "Trees Planted",
            value: formatNumber(Number(totalTreesPlanted)),
            changePercent: generateChangePercent(totalTreesPlantedChange).value,
            vf: generateChangePercent(totalTreesPlantedChange).vf,
            icon: Leaf
          },
          {
            title: "Species Planted",
            value: totalSpeciesPlanted,
            changePercent: generateChangePercent(totalSpeciesPlantedChange).value,
            vf: generateChangePercent(totalSpeciesPlantedChange).vf,

            icon: Sprout
          },
          {
            title: "Area Covered",
            value: `${formatNumber(Number(totalAreaCovered))} ha`,
            changePercent: generateChangePercent(totalAreaCoveredChange).value,
            vf: generateChangePercent(totalAreaCoveredChange).vf,

            icon: Map
          },
          {
            title: "Field Data Collectors",
            value: totalContributors,
            changePercent: generateChangePercent(totalContributorsChange).value,
            vf: generateChangePercent(totalContributorsChange).vf,

            icon: Activity
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching dashboard KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-4">
      <div className="flex gap-3 overflow-x-auto md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {loading ? (
          // Show shimmer cards while loading
          Array.from({ length: 4 }).map((_, index) => (
            <ShimmerCard key={index} />
          ))
        ) : (
          overview.map((stat, index) => (
            <div key={index} className="flex-shrink-0 md:flex-1">
              <StatCard
                title={stat.title}
                value={stat.value}
                changePercent={stat.changePercent}
                icon={stat.icon}
                loading={loading} note={undefined}
                vf={stat.vf} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StatCardsContainer;