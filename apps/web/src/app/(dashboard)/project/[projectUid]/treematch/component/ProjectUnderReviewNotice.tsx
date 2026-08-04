'use client'

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  projectName: string;
  className?: string;
}

/**
 * The donation backend only knows a project once a Platform Admin has approved
 * and synced it, and answers 404 until then. That is a state of the project, not
 * a failed request, so this is deliberately not an error box and offers nothing
 * to retry: nothing the user does on this screen moves it along.
 *
 * One component because two screens hit the same wall, the donations pane and
 * the auto-match rules, and they should say the same thing word for word.
 */
export function ProjectUnderReviewNotice({ projectName, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10">
        <Clock size={18} className="text-amber-600" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">
        {projectName} is under review
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        It has not been synced to the platform yet, so there are no donations to
        show. You will see them once a Platform Admin approves the project.
      </p>
    </div>
  );
}
