
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, FileText, XCircle } from "lucide-react";

type ProposalStatus = 'open' | 'accepted' | 'refused';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "refused":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "accepted":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "refused":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <FileText className="h-4 w-4 text-yellow-600" />;
  }
};

export const ProposalStatusBadge = ({ status }: ProposalStatusBadgeProps) => {
  return (
    <Badge 
      variant="outline"
      className={cn(
        "flex w-fit items-center gap-1",
        getStatusColor(status)
      )}
    >
      {getStatusIcon(status)}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};
