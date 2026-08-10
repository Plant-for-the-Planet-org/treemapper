import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SIZE: Record<string, string> = {
  small: 'sm:max-w-md',
  default: 'sm:max-w-2xl',
  large: 'sm:max-w-4xl',
}

export const Modal = ({ isOpen, onClose, title, children, size = 'default' }: any) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className={cn('p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col', SIZE[size])}>
      <DialogHeader className="px-5 py-4 border-b border-border flex-shrink-0">
        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
      </DialogHeader>
      <div className="p-5 overflow-y-auto">{children}</div>
    </DialogContent>
  </Dialog>
)
