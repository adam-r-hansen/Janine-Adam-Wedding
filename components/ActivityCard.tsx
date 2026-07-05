import Panel from "./Panel";
import PlaceholderImage from "./PlaceholderImage";
import type { Activity } from "@/lib/placeholder-data";

const CATEGORY_LABEL: Record<Activity["category"], string> = {
  activity: "Activity",
  food_drink: "Food & Drink",
};

export default function ActivityCard({
  activity,
  variant = 0,
}: {
  activity: Activity;
  variant?: number;
}) {
  return (
    <Panel className="flex flex-col overflow-hidden p-0">
      <PlaceholderImage
        label={activity.name}
        variant={variant}
        className="aspect-[4/3]"
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-night">
          {CATEGORY_LABEL[activity.category]}
        </span>
        <h3 className="font-heading text-xl text-accent">{activity.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-foreground/90">
          {activity.blurb}
        </p>
        <p className="text-xs uppercase tracking-wide text-foreground/60">
          {activity.neighborhood}
        </p>
        <a
          href={activity.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-cream transition-opacity hover:opacity-90 dark:text-night"
        >
          Learn More
        </a>
      </div>
    </Panel>
  );
}
