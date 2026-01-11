'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';

interface ApprovalFiltersProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: string | null) => void;
  onReset: () => void;
}

export const ApprovalFilters: React.FC<ApprovalFiltersProps> = ({
  onSearch,
  onStatusFilter,
  onReset,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by intervention ID or creator name..."
          className="pl-10"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <Select onValueChange={(value) => onStatusFilter(value === 'all' ? null : value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="new_request">New Requests</SelectItem>
          <SelectItem value="in_review">In Review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onReset}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </Button>
    </div>
  );
};
