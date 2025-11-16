/**
 * TopicsView Component
 * Root React component that orchestrates the entire topics view
 * Manages state via useTopics hook and renders main UI sections
 */

import React, { useState } from "react";
import { toast } from "sonner";
import { useTopics } from "@/components/hooks/useTopics";
import { TopicsProvider } from "./TopicsContext";
import TopicFilters from "./TopicFilters";
import TechnologyAccordion from "./TechnologyAccordion";
import DeleteTopicDialog from "./DeleteTopicDialog";
import { Toaster } from "@/components/ui/sonner";

export default function TopicsView() {
  const { state, actions } = useTopics();
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    topicId: string | null;
    topicTitle: string;
  }>({
    isOpen: false,
    topicId: null,
    topicTitle: "",
  });

  const handleDeleteClick = (topicId: string, topicTitle: string) => {
    setDeleteDialogState({
      isOpen: true,
      topicId,
      topicTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialogState.topicId) {
      try {
        await actions.deleteTopic(deleteDialogState.topicId);
        toast.success("Topic deleted", {
          description: `"${deleteDialogState.topicTitle}" and all its sub-topics have been deleted.`,
        });
      } catch (error) {
        toast.error("Failed to delete topic", {
          description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        });
      }
    }
    setDeleteDialogState({ isOpen: false, topicId: null, topicTitle: "" });
  };

  const contextValue = {
    ...actions,
    onDeleteClick: handleDeleteClick,
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Topics</h1>
            <p className="text-muted-foreground mt-2">Manage your learning topics and track your progress</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading topics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Topics</h1>
            <p className="text-muted-foreground mt-2">Manage your learning topics and track your progress</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-destructive">{state.error}</p>
          <button
            type="button"
            onClick={actions.retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <TopicsProvider value={contextValue}>
      <Toaster />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Topics</h1>
            <p className="text-muted-foreground mt-2">Manage your learning topics and track your progress</p>
          </div>
        </div>

        <TopicFilters filters={state.filters} onFilterChange={actions.setFilters} />

        <TechnologyAccordion topicsByTechnology={state.topicsByTechnology} />

        <DeleteTopicDialog
          isOpen={deleteDialogState.isOpen}
          onOpenChange={(isOpen) => setDeleteDialogState((prev) => ({ ...prev, isOpen }))}
          onConfirm={handleDeleteConfirm}
          topicTitle={deleteDialogState.topicTitle}
        />
      </div>
    </TopicsProvider>
  );
}
