
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
      descobertas: {
        label: "Descobertas",
        color: "hsl(var(--primary))",
      },
}

interface ActivityChartProps {
    data: {
        date: string;
        day: string;
        descobertas: number;
    }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <BarChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="descobertas" fill="var(--color-descobertas)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
