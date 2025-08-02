"use client"
import React, { useState } from "react";
import { Resizable } from "re-resizable";
import StatisticsChart from "@/components/StatisticsChart";

function generateDataset(type: string): number[] {
    switch (type) {
        case "few-different":
            return Array.from({ length: 5 }, (_, i) => i * 2 + 1);
        case "many-similar":
            return Array(40).fill(10).map((v, i) => (i < 35 ? 10 : i % 5 + 7));
        case "all-same":
            return Array(20).fill(5);
        case "spread-out":
            return Array.from({ length: 80 }, () => Math.floor(Math.random() * 100));
        case "almost-all-same":
            return Array(30).fill(42).map((v, i) => (i < 27 ? 42 : i % 3 + 40));
        default:
            return Array.from({ length: 10 }, () => Math.floor(Math.random() * 20));
    }
}

const datasetOptions = [
    { label: "Few values, all different", value: "few-different" },
    { label: "Many values, mostly the same", value: "many-similar" },
    { label: "All values the same", value: "all-same" },
    { label: "Spread out values", value: "spread-out" },
    { label: "Almost all the same", value: "almost-all-same" },
    { label: "Random values", value: "random" },
];

export default function StatisticsChartDemo() {
    const [selectedDataset, setSelectedDataset] = useState(datasetOptions[0].value);
    const [size, setSize] = useState({ width: 900, height: 500 });
    const data = generateDataset(selectedDataset);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">StatisticsChart Demo</h1>
            <div className="mb-4">
                <label htmlFor="dataset-select" className="mr-2 font-semibold">Select dataset:</label>
                <select
                    id="dataset-select"
                    value={selectedDataset}
                    onChange={e => setSelectedDataset(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    {datasetOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <Resizable
                size={size}
                onResizeStop={(e, direction, ref, d) => {
                    setSize({
                        width: size.width + d.width,
                        height: size.height + d.height,
                    });
                }}
                minWidth={400}
                minHeight={300}
                style={{ border: "2px solid #ccc", borderRadius: 8, background: "#fafafa", padding: 8 }}
            >
                <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
                    <StatisticsChart data={data} />
                </div>
            </Resizable>
        </div>
    );
}
