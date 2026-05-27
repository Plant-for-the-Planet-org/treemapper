import { ArrowLeft, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export const Header = ({ onLogout }) => {
  const { back } = useRouter()
  return (
    <div className="bg-background border-b border-border sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={back} className="h-8 w-8">
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-base font-semibold text-foreground">Profile settings</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut size={14} className="mr-1.5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
