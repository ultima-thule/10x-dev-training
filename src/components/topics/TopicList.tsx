/**
 * TopicList Component
 * Recursive component that renders a list of TopicItem components
 * Used for both root topics and nested child topics
 */

import React from "react";
import type { TopicViewModel } from "./types";
import TopicItem from "./TopicItem";

interface TopicListProps {
  readonly topics: TopicViewModel[];
  readonly level?: number;
}

export default function TopicList({ topics, level = 0 }: TopicListProps) {
  if (topics.length === 0) {
    return <div className="text-sm text-muted-foreground italic py-2">No topics at this level</div>;
  }

  return (
    <div className="space-y-2">
      {topics.map((topic) => (
        <TopicItem key={topic.id} topic={topic} level={level} />
      ))}
    </div>
  );
}
