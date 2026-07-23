import { LoadingMyEvent } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <LoadingMyEvent text="Fetching your tickets" />
    </div>
  );
}
