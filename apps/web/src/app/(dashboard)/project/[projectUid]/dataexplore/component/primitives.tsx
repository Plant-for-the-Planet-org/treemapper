'use client'

import type { ReactNode, ElementType } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  title: string
  value: string | number
  hint?: string
  icon: ElementType
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {hint ? <p className="text-xs text-muted-foreground mt-0.5">{hint}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * A titled panel with optional controls on the right. Mirrors the layout of the
 * old Data Explorer, where every widget had its title left and its selector or
 * toolbar right.
 */
export function SectionCard({
  title,
  description,
  controls,
  children,
  contentClassName,
}: {
  title: string
  description?: string
  controls?: ReactNode
  children: ReactNode
  contentClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          ) : null}
        </div>
        {controls ? <div className="flex items-center gap-2 shrink-0">{controls}</div> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-muted-foreground text-sm text-center py-16">{message}</p>
}
