/**
 * TopicItem Component
 * Renders a single topic with its metadata, actions, and nested children
 * Handles expansion logic for loading and displaying child topics
 */

import React from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTopicsContext } from "./TopicsContext";
import type { TopicViewModel } from "./types";
import type { TopicStatusEnum } from "@/types";
import TopicList from "./TopicList";

interface TopicItemProps {
  readonly topic: TopicViewModel;
  readonly level: number;
}

const STATUS_COLORS: Record<TopicStatusEnum, string> = {
  to_do: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const STATUS_LABELS: Record<TopicStatusEnum, string> = {
  to_do: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function TopicItem({ topic, level }: TopicItemProps) {
  const { loadChildren, toggleExpanded, updateTopicStatus, onDeleteClick } = useTopicsContext();
  const hasChildren = topic.children_count > 0;

  const handleExpand = async () => {
    if (hasChildren && topic.children.length === 0 && !topic.isLoadingChildren) {
      try {
        await loadChildren(topic.id);
      } catch (error) {
        toast.error("Failed to load sub-topics", {
          description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        });
        return; // Don't toggle expanded state on error
      }
    }
    toggleExpanded(topic.id);
  };

  const handleStatusChange = async (status: TopicStatusEnum) => {
    try {
      await updateTopicStatus(topic.id, status);
      toast.success("Status updated", {
        description: `"${topic.title}" is now marked as ${STATUS_LABELS[status]}.`,
      });
    } catch (error) {
      toast.error("Failed to update status", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleDelete = () => {
    onDeleteClick(topic.id, topic.title);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 p-3 border rounded-md hover:bg-muted/50 transition-colors group">
        {/* Expander button */}
        {hasChildren && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0"
            onClick={handleExpand}
            aria-label={topic.isExpanded ? "Collapse" : "Expand"}
            aria-expanded={topic.isExpanded}
          >
            {topic.isExpanded ? "▼" : "▶"}
          </Button>
        )}
        {!hasChildren && <div className="w-6 flex-shrink-0" />}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium leading-tight">{topic.title}</h4>
              {topic.description && <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>}
              {topic.leetcode_links && topic.leetcode_links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {topic.leetcode_links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <span>🔗</span>
                      <span>{link.title}</span>
                      <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                        {link.difficulty}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Status, children count, and actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={STATUS_COLORS[topic.status]}>{STATUS_LABELS[topic.status]}</Badge>
              {hasChildren && (
                <Badge variant="secondary" className="text-xs">
                  {topic.children_count}
                </Badge>
              )}

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Topic actions"
                  >
                    <span className="text-lg leading-none">⋮</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleStatusChange("to_do")}>To Do</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>In Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("completed")}>Completed</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state for children */}
      {topic.isLoadingChildren && <div className="ml-8 text-sm text-muted-foreground py-2">Loading children...</div>}

      {/* Nested children */}
      {topic.isExpanded && topic.children.length > 0 && (
        <div className="ml-8 border-l-2 border-muted pl-4">
          <TopicList topics={topic.children} level={level + 1} />
        </div>
      )}
    </div>
  );
}
