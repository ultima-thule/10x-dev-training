/**
 * useTopics Hook
 * Manages state and API interactions for the Topics List view
 *
 * Responsibilities:
 * - Fetch and manage root topics
 * - Lazy-load children for specific topics
 * - Handle filtering and pagination
 * - Implement optimistic updates for status changes and deletions
 * - Provide error handling and rollback on failures
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { TopicListResponseDTO, TopicChildrenResponseDTO, TopicStatusEnum, UpdateTopicCommand } from "@/types";
import type { TopicsViewState, TopicViewModel, TopicFilters } from "@/components/topics/types";

/**
 * Transform TopicListItemDTO to TopicViewModel
 */
function transformToViewModel(topic: TopicListResponseDTO["data"][0]): TopicViewModel {
  return {
    ...topic,
    children: [],
    isLoadingChildren: false,
    isExpanded: false,
  };
}

/**
 * Group topics by technology
 */
function groupByTechnology(topics: TopicViewModel[]): Record<string, TopicViewModel[]> {
  return topics.reduce(
    (acc, topic) => {
      if (!acc[topic.technology]) {
        acc[topic.technology] = [];
      }
      acc[topic.technology].push(topic);
      return acc;
    },
    {} as Record<string, TopicViewModel[]>
  );
}

/**
 * Custom hook for managing topics state and operations
 */
export function useTopics() {
  const [state, setState] = useState<TopicsViewState>({
    topicsByTechnology: {},
    isLoading: true,
    error: null,
    filters: {
      status: undefined,
    },
    pagination: {
      page: 1,
      limit: 100,
      total: 0,
      total_pages: 0,
    },
  });

  // Ref to track mounted state
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch root topics from API
   */
  const fetchTopics = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      params.set("parent_id", "null"); // Only root topics

      if (state.filters.status && state.filters.status !== "all") {
        params.set("status", state.filters.status);
      }

      params.set("page", state.pagination.page.toString());
      params.set("limit", state.pagination.limit.toString());

      const response = await fetch(`/api/topics?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
      }

      const data: TopicListResponseDTO = await response.json();

      if (!isMountedRef.current) return;

      const viewModels = data.data.map(transformToViewModel);
      const grouped = groupByTechnology(viewModels);

      setState((prev) => ({
        ...prev,
        topicsByTechnology: grouped,
        pagination: data.pagination,
        isLoading: false,
      }));
    } catch (error) {
      if (!isMountedRef.current) return;

      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to fetch topics",
        isLoading: false,
      }));
    }
  }, [state.filters.status, state.pagination.page, state.pagination.limit]);

  /**
   * Load children for a specific topic
   */
  const loadChildren = useCallback(async (topicId: string) => {
    if (!isMountedRef.current) return;

    // Mark topic as loading children
    setState((prev) => {
      const updated = { ...prev };
      for (const tech of Object.keys(updated.topicsByTechnology)) {
        updated.topicsByTechnology[tech] = updated.topicsByTechnology[tech].map((topic) =>
          updateTopicRecursive(topic, topicId, { isLoadingChildren: true })
        );
      }
      return updated;
    });

    try {
      const response = await fetch(`/api/topics/${topicId}/children`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to load children: ${response.status}`);
      }

      const data: TopicChildrenResponseDTO = await response.json();

      if (!isMountedRef.current) return;

      const childViewModels = data.data.map(transformToViewModel);

      // Update topic with loaded children
      setState((prev) => {
        const updated = { ...prev };
        for (const tech of Object.keys(updated.topicsByTechnology)) {
          updated.topicsByTechnology[tech] = updated.topicsByTechnology[tech].map((topic) =>
            updateTopicRecursive(topic, topicId, {
              children: childViewModels,
              isLoadingChildren: false,
            })
          );
        }
        return updated;
      });
    } catch (error) {
      if (!isMountedRef.current) return;

      // Reset loading state on error
      setState((prev) => {
        const updated = { ...prev };
        for (const tech of Object.keys(updated.topicsByTechnology)) {
          updated.topicsByTechnology[tech] = updated.topicsByTechnology[tech].map((topic) =>
            updateTopicRecursive(topic, topicId, { isLoadingChildren: false })
          );
        }
        return updated;
      });

      // Re-throw error so component can handle it
      throw error;
    }
  }, []);

  /**
   * Toggle expanded state for a topic
   */
  const toggleExpanded = useCallback((topicId: string) => {
    setState((prev) => {
      const updated = { ...prev };
      for (const tech of Object.keys(updated.topicsByTechnology)) {
        updated.topicsByTechnology[tech] = updated.topicsByTechnology[tech].map((topic) =>
          updateTopicRecursive(topic, topicId, { isExpanded: !findTopic(topic, topicId)?.isExpanded })
        );
      }
      return updated;
    });
  }, []);

  /**
   * Update topic status with optimistic update
   */
  const updateTopicStatus = useCallback(async (topicId: string, status: TopicStatusEnum) => {
    if (!isMountedRef.current) return;

    // Store previous state for rollback
    let previousState: TopicsViewState | null = null;

    setState((prev) => {
      previousState = prev;
      const updated = { ...prev };
      for (const tech of Object.keys(updated.topicsByTechnology)) {
        updated.topicsByTechnology[tech] = updated.topicsByTechnology[tech].map((topic) =>
          updateTopicRecursive(topic, topicId, { status })
        );
      }
      return updated;
    });

    try {
      const payload: UpdateTopicCommand = { status };
      const response = await fetch(`/api/topics/${topicId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update topic: ${response.status}`);
      }
    } catch (error) {
      if (!isMountedRef.current || !previousState) return;

      // Rollback on error
      setState(previousState);
      throw error;
    }
  }, []);

  /**
   * Delete topic with optimistic update
   */
  const deleteTopic = useCallback(async (topicId: string) => {
    if (!isMountedRef.current) return;

    // Store previous state for rollback
    let previousState: TopicsViewState | null = null;

    setState((prev) => {
      previousState = prev;
      const updated = { ...prev };
      const newTopicsByTechnology: Record<string, TopicViewModel[]> = {};

      for (const tech of Object.keys(updated.topicsByTechnology)) {
        const filteredTopics = updated.topicsByTechnology[tech]
          .map((topic) => removeTopicRecursive(topic, topicId))
          .filter((topic): topic is TopicViewModel => topic !== null);

        // Only include technology groups that still have topics
        if (filteredTopics.length > 0) {
          newTopicsByTechnology[tech] = filteredTopics;
        }
      }

      updated.topicsByTechnology = newTopicsByTechnology;
      return updated;
    });

    try {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete topic: ${response.status}`);
      }
    } catch (error) {
      if (!isMountedRef.current || !previousState) return;

      // Rollback on error
      setState(previousState);
      throw error;
    }
  }, []);

  /**
   * Update filters and refetch topics
   */
  const setFilters = useCallback((filters: TopicFilters) => {
    setState((prev) => ({
      ...prev,
      filters,
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }));
  }, []);

  /**
   * Retry fetching topics on error
   */
  const retry = useCallback(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Initial fetch
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    state,
    actions: {
      loadChildren,
      toggleExpanded,
      updateTopicStatus,
      deleteTopic,
      setFilters,
      retry,
    },
  };
}

/**
 * Recursively update a topic in the tree
 */
function updateTopicRecursive(
  topic: TopicViewModel,
  targetId: string,
  updates: Partial<TopicViewModel>
): TopicViewModel {
  if (topic.id === targetId) {
    return { ...topic, ...updates };
  }

  if (topic.children.length > 0) {
    return {
      ...topic,
      children: topic.children.map((child) => updateTopicRecursive(child, targetId, updates)),
    };
  }

  return topic;
}

/**
 * Recursively remove a topic from the tree
 */
function removeTopicRecursive(topic: TopicViewModel, targetId: string): TopicViewModel | null {
  if (topic.id === targetId) {
    return null;
  }

  if (topic.children.length > 0) {
    return {
      ...topic,
      children: topic.children
        .map((child) => removeTopicRecursive(child, targetId))
        .filter((child): child is TopicViewModel => child !== null),
    };
  }

  return topic;
}

/**
 * Find a topic in the tree
 */
function findTopic(topic: TopicViewModel, targetId: string): TopicViewModel | null {
  if (topic.id === targetId) {
    return topic;
  }

  for (const child of topic.children) {
    const found = findTopic(child, targetId);
    if (found) return found;
  }

  return null;
}
