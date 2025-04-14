import React from 'react'

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
            {children}

    </div>
  )
}
