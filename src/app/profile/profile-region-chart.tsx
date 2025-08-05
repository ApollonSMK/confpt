
'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ProfileRegionChartProps {
    data: { district: string; selos: number }[];
}

const chartConfig = {
  selos: {
    label: "Selos",
    color: "hsl(var(--primary))",
  },
}

export function ProfileRegionChart({ data }: ProfileRegionChartProps) {
  return (
    <div className="h-[300px] w-full">
        <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="district"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="selos" fill="var(--color-selos)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    </div>
  )
}
