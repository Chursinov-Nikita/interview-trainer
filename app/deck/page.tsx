import { Suspense } from "react";
import Page from "../elements/Page";
import { PageSkeleton } from "../elements/Visuals";
import DeckView from "./DeckView";

// Колоды пользователя не известны при сборке, поэтому id — в ?id=, а не в пути
export default function DeckPage() {
  return (
    <Page>
      <Suspense fallback={<PageSkeleton />}>
        <DeckView />
      </Suspense>
    </Page>
  );
}
