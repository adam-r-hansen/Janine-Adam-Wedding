"use client";

import { useState } from "react";
import ActivityCard from "./ActivityCard";
import type { Activity } from "@/lib/placeholder-data";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "activity", label: "Activities" },
  { id: "food_drink", label: "Food & Drink" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export default function ActivityFilter({
  activities,
}: {
  activities: Activity[];
}) {
  const [filter, setFilter] = useState<FilterId>("all");

  const visible =
    filter === "all"
      ? activities
      : activities.filter((activity) => activity.category === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-accent text-cream dark:text-night"
                : "text-accent hover:bg-accent/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((activity, i) => (
          <ActivityCard key={activity.id} activity={activity} variant={i} />
        ))}
      </div>
    </div>
  );
}
