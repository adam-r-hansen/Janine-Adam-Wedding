import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import EnterPasswordForm from "@/components/EnterPasswordForm";

export default async function EnterPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <PageContainer narrow>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.2em] text-accent sm:text-4xl">
          JANINE{" "}
          <span className="font-script text-2xl tracking-normal sm:text-3xl">
            and
          </span>{" "}
          ADAM
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          Enter the password from your invitation.
        </p>

        <EnterPasswordForm redirectTo={redirectTo ?? "/"} />
      </Panel>
    </PageContainer>
  );
}
