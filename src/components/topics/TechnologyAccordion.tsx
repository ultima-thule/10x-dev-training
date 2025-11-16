/**
 * TechnologyAccordion Component
 * Displays topics grouped by technology inside an accordion
 * Uses Shadcn Accordion with type="multiple" to allow multiple sections open
 */

import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { TopicViewModel } from "./types";
import TopicList from "./TopicList";

interface TechnologyAccordionProps {
  readonly topicsByTechnology: Record<string, TopicViewModel[]>;
}

export default function TechnologyAccordion({ topicsByTechnology }: TechnologyAccordionProps) {
  const technologies = Object.keys(topicsByTechnology).sort((a, b) => a.localeCompare(b));

  if (technologies.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No topics found. Start by generating some topics!</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {technologies.map((technology) => {
        const topics = topicsByTechnology[technology];
        return (
          <AccordionItem key={technology} value={technology} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{technology}</span>
                <Badge variant="secondary">{topics.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-2">
              <TopicList topics={topics} level={0} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
