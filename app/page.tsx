import Countdown from "@/components/Countdown";
import Panel from "@/components/Panel";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-24 pt-10 sm:pt-16">
      <Panel className="w-full max-w-lg p-8 text-center sm:p-10">
        <h1 className="font-heading text-4xl leading-tight tracking-[0.2em] text-accent sm:text-5xl">
          JANINE{" "}
          <span className="font-script text-3xl tracking-normal sm:text-4xl">
            and
          </span>{" "}
          ADAM
        </h1>

        <p className="mt-4 font-heading text-lg tracking-wide text-foreground sm:text-xl">
          Saturday, October 17, 2026
        </p>

        <div className="mt-8">
          <Countdown />
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-foreground/70 sm:text-sm">
          University Place, Washington
        </p>

        <p className="mt-6 text-base leading-relaxed text-foreground/90">
          {
            "We can't wait to celebrate this next chapter surrounded by the people we love most."
          }
        </p>
      </Panel>
    </div>
  );
}
