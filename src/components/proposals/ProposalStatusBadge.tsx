
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, FileText, XCircle, Clock } from "lucide-react";

type ProposalStatus = 'open' | 'accepted' | 'refused' | 'lost' | 'pending';

interface ProposalStatusBadgeProps {
  status: string;
}

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "refused":
    case "lost":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "pending":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default: // open
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "refused":
    case "lost":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-gray-600" />;
    default: // open
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
