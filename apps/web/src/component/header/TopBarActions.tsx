'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface TopBarAction {
  label: string
  onClick: () => void
  icon?: React.ComponentType<{ size?: number }>
  variant?: 'primary' | 'outline' | 'ghost'
  hideLabelOnMobile?: boolean
}

interface TopBarActionsContextValue {
  actions: TopBarAction[]
  setActions: (actions: TopBarAction[]) => void
}

const TopBarActionsContext = createContext<TopBarActionsContextValue | null>(null)

export function TopBarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<TopBarAction[]>([])
  return (
    <TopBarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </TopBarActionsContext.Provider>
  )
}

export function useTopBarActions(actions: TopBarAction[], deps: any[] = []) {
  const ctx = useContext(TopBarActionsContext)
  useEffect(() => {
    if (!ctx) return
    ctx.setActions(actions)
    return () => ctx.setActions([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export function useRegisteredTopBarActions() {
  const ctx = useContext(TopBarActionsContext)
  return ctx?.actions || []
}
