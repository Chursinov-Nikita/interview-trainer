import { Suspense } from "react";
import ReviewView, { ReviewSkeleton } from "./ReviewView";

// useSearchParams в статическом экспорте требует границу Suspense
export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ReviewView />
    </Suspense>
  );
}
