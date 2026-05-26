'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface ApprovalFiltersProps {
  onSearch: (query: string) => void
}

export const ApprovalFilters: React.FC<ApprovalFiltersProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearch(value)
  }

  const handleClear = () => {
    setSearchValue('')
    onSearch('')
  }

  return (
    <div className="mb-5">
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, description, or creator..."
          className="pl-9 pr-9"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
