
import { Loader2 } from "lucide-react";

export const DashboardLoading = () => {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};
