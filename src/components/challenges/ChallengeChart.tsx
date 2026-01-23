import { useMemo } from "react";
import { UserObservation } from "@/hooks/useChallenges";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { hu } from "date-fns/locale";

interface ChallengeChartProps {
  observations: UserObservation[];
  category: string;
  label: string;
  daysToShow?: number;
  showTrendLine?: boolean;
}

export function ChallengeChart({
  observations,
  category,
  label,
  daysToShow = 14,
  showTrendLine = true,
}: ChallengeChartProps) {
  const chartData = useMemo(() => {
    // Get date range
    const endDate = new Date();
    const startDate = subDays(endDate, daysToShow - 1);
    
    // Create a map of date -> value
    const valueMap = new Map<string, number>();
    observations
      .filter(o => o.category === category && o.numeric_value !== null)
      .forEach(o => {
        const dateKey = o.observation_date;
        // If multiple entries for same day, use the latest
        if (!valueMap.has(dateKey)) {
          valueMap.set(dateKey, o.numeric_value!);
        }
      });
    
    // Generate data points for each day
    const data: Array<{ date: string; value: number | null; displayDate: string }> = [];
    for (let i = 0; i < daysToShow; i++) {
      const date = subDays(endDate, daysToShow - 1 - i);
      const dateKey = format(date, "yyyy-MM-dd");
      data.push({
        date: dateKey,
        value: valueMap.get(dateKey) ?? null,
        displayDate: format(date, "MM.dd", { locale: hu }),
      });
    }
    
    return data;
  }, [observations, category, daysToShow]);

  // Calculate average for trend line
  const average = useMemo(() => {
    const values = chartData.filter(d => d.value !== null).map(d => d.value!);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [chartData]);

  const hasData = chartData.some(d => d.value !== null);

  if (!hasData) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Még nincs elegendő adat a grafikonhoz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelFormatter={(value) => `Dátum: ${value}`}
              formatter={(value: number) => [value, label]}
            />
            {showTrendLine && average !== null && (
              <ReferenceLine 
                y={average} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ 
                  value: `Átlag: ${average.toFixed(1)}`, 
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))"
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
