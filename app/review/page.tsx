import { Suspense } from "react";
import ReviewView, { ReviewSkeleton } from "./ReviewView";

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ReviewView />
    </Suspense>
  );
}
