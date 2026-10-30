import { Suspense } from "react";
import Page from "../elements/Page";
import { PageSkeleton } from "../elements/Visuals";
import DecksView from "./DecksView";

export default function DecksPage() {
  return (
    <Page>
      <Suspense fallback={<PageSkeleton />}>
        <DecksView />
      </Suspense>
    </Page>
  );
}
