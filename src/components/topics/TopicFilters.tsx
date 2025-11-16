/**
 * TopicFilters Component
 * Control bar for filtering the topic list and initiating topic generation
 */

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TopicFilters as TopicFiltersType } from "./types";

interface TopicFiltersProps {
  readonly filters: TopicFiltersType;
  readonly onFilterChange: (filters: TopicFiltersType) => void;
}

export default function TopicFilters({ filters, onFilterChange }: TopicFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value === "all" ? undefined : (value as TopicFiltersType["status"]),
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg flex-wrap">
      <div className="flex items-center gap-4">
        <label htmlFor="status-filter" className="text-sm font-medium">
          Filter by Status:
        </label>
        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="to_do">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button asChild variant="default">
        <a href="/app/topics/generate">Generate Topics</a>
      </Button>
    </div>
  );
}
