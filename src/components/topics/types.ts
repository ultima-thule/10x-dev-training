/**
 * Type definitions for the Topics List View
 * Extends API DTOs with client-side UI state
 */

import type { TopicListItemDTO, PaginationMetadata, TopicStatusEnum } from "@/types";

/**
 * View model for a single topic with UI state
 * Extends TopicListItemDTO to include client-side state for expansion and lazy-loading
 */
export interface TopicViewModel extends TopicListItemDTO {
  children: TopicViewModel[]; // Array of loaded child topics, initially empty
  isLoadingChildren: boolean; // True while fetching children for this topic
  isExpanded: boolean; // Tracks if the topic is expanded in the UI
}

/**
 * Complete state for the Topics View managed by useTopics hook
 */
export interface TopicsViewState {
  topicsByTechnology: Record<string, TopicViewModel[]>;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: TopicStatusEnum | "all";
  };
  pagination: PaginationMetadata;
}

/**
 * Filter state for topic filtering
 */
export interface TopicFilters {
  status?: TopicStatusEnum | "all";
}

/**
 * Context value for sharing topic actions across components
 */
export interface TopicsContextValue {
  updateTopicStatus: (topicId: string, status: TopicStatusEnum) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  loadChildren: (topicId: string) => Promise<void>;
  toggleExpanded: (topicId: string) => void;
  setFilters: (filters: TopicFilters) => void;
  retry: () => void;
  onDeleteClick: (topicId: string, topicTitle: string) => void;
}
