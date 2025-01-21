import ClientOnly from "@/components/client-only";
import OuterbaseSourcePageClient from "./page-client";
import ThemeLayout from "@/app/(theme)/theme_layout";

interface OuterbaseSourcePageProps {
  params: Promise<{
    workspaceId: string;
    sourceId: string;
  }>;
}

export default async function OuterbaseSourcePage(
  props: OuterbaseSourcePageProps
) {
  const params = await props.params;

  return (
    <ThemeLayout>
      <ClientOnly>
        <OuterbaseSourcePageClient
          sourceId={params.sourceId}
          workspaceId={params.workspaceId}
        />
      </ClientOnly>
    </ThemeLayout>
  );
}
