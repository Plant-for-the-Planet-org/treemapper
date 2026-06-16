import { Sprout, TrendingUp, Activity, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper'

interface StatProps {
  activeCount: number
  totalCount: number
  topPlanted: { name: string; count: number } | null
  totalInterventions: number
  unknownCount: number
}

const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
}) => (
  <Card className="py-0 hover:shadow-md transition-shadow duration-200">
    <CardContent className="px-4 py-3">
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="text-xs font-medium text-muted-foreground leading-tight">{title}</h3>
        <div className="bg-primary/10 p-1.5 rounded-lg">
          <Icon size={15} className="text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
)

export const SpeciesStats = ({
  activeCount,
  totalCount,
  topPlanted,
  totalInterventions,
  unknownCount,
}: StatProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <StatCard
      title="Species"
      value={`${activeCount}/${totalCount}`}
      sub="Active in this project"
      icon={Sprout}
    />
    <StatCard
      title="Most planted"
      value={topPlanted ? formatNumber(topPlanted.count) : '0'}
      sub={topPlanted?.name || 'No data yet'}
      icon={TrendingUp}
    />
    <StatCard
      title="Total interventions"
      value={formatNumber(totalInterventions)}
      sub="Across all species"
      icon={Activity}
    />
    <StatCard
      title="Unknown species"
      value={unknownCount}
      sub={unknownCount > 0 ? 'Awaiting identification' : 'All identified'}
      icon={HelpCircle}
    />
  </div>
)
