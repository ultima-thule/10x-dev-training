/**
 * DeleteTopicDialog Component
 * Confirmation modal to prevent accidental topic deletion
 * Warns user that deleting will also delete all sub-topics
 */

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTopicDialogProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onConfirm: () => void;
  readonly topicTitle: string;
}

export default function DeleteTopicDialog({ isOpen, onOpenChange, onConfirm, topicTitle }: DeleteTopicDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Topic</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{topicTitle}&rdquo;? This will also delete all its sub-topics. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
