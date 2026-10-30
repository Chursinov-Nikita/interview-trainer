import { Suspense } from "react";
import Page from "../elements/Page";
import { PageSkeleton } from "../elements/Visuals";
import DeckView from "./DeckView";

export default function DeckPage() {
  return (
    <Page>
      <Suspense fallback={<PageSkeleton />}>
        <DeckView />
      </Suspense>
    </Page>
  );
}
