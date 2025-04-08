
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Period } from "@/hooks/useDashboardData";

interface PeriodSelectorProps {
  period: Period;
  onPeriodChange: (value: Period) => void;
}

export const PeriodSelector = ({ period, onPeriodChange }: PeriodSelectorProps) => {
  return (
    <Tabs 
      defaultValue="6months" 
      value={period} 
      onValueChange={(value) => onPeriodChange(value as Period)} 
      className="w-[400px]"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="3months">3 Months</TabsTrigger>
        <TabsTrigger value="6months">6 Months</TabsTrigger>
        <TabsTrigger value="1year">1 Year</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
