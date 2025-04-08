
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimeRange = "7days" | "30days" | "3months" | "6months" | "1year";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as TimeRange)}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Select time range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7days">Last 7 days</SelectItem>
        <SelectItem value="30days">Last 30 days</SelectItem>
        <SelectItem value="3months">Last 3 months</SelectItem>
        <SelectItem value="6months">Last 6 months</SelectItem>
        <SelectItem value="1year">Last 1 year</SelectItem>
      </SelectContent>
    </Select>
  );
}
