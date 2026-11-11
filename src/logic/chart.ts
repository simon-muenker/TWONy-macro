import Chart from "chart.js/auto";

import { config } from "@logic/config.ts";
import type { NodeData } from "@logic/generator.ts";

const INK_MUTED = "#94a3b8"; // slate-400
const GRID = "rgba(148, 163, 184, 0.15)";
export const MEAN_COLOR = "#60a5fa"; // blue-400
const MEAN_LABEL = "Average sentiment";

export function createChart(canvas: HTMLCanvasElement): Chart {
  const ctx: CanvasRenderingContext2D = canvas.getContext(
    "2d",
  ) as CanvasRenderingContext2D;

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      normalized: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 0,
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Step", color: INK_MUTED },
          ticks: { color: INK_MUTED, maxTicksLimit: 11, maxRotation: 0 },
          grid: { display: false },
          border: { color: GRID },
        },
        y: {
          min: 0.0,
          max: 1.0,
          title: { display: true, text: "Sentiment", color: INK_MUTED },
          ticks: {
            color: INK_MUTED,
            stepSize: 0.25,
            callback: (value) => Number(value).toFixed(2),
          },
          grid: { color: GRID },
          border: { display: false },
        },
      },
      plugins: {
        legend: {
          display: false, // rendered as HTML next to the metrics
        },
        tooltip: {
          // only the average is worth reading off; agent lines show the shape
          filter: (item) => item.dataset.label === MEAN_LABEL,
          displayColors: false,
          callbacks: {
            title: (items) => (items.length ? `Step ${items[0].label}` : ""),
            label: (item) =>
              `${MEAN_LABEL}: ${(item.parsed.y as number).toFixed(3)}`,
          },
        },
      },
    },
  });
}

export function prepareChart(
  chart: Chart,
  data: Array<NodeData>,
  mean: number,
): void {
  const agentColor = `rgba(255, 255, 255, ${agentAlpha(data.length)})`;

  chart.data.datasets = data.map((node) => ({
    label: "_",
    data: [node.sentiment],
    borderColor: agentColor,
    borderWidth: 0.5,
    fill: false,
    tension: 0.1,
    order: 1,
  }));

  chart.data.datasets.push({
    label: MEAN_LABEL,
    data: [mean],
    borderColor: MEAN_COLOR,
    borderWidth: 2,
    fill: false,
    tension: 0.1,
    order: 0, // drawn on top of the agent lines
  });

  syncChartLabels(chart);
  chart.update();
}

export function updateChartData(
  chart: Chart,
  data: Array<NodeData>,
  mean: number,
  shouldRender: boolean = true,
) {
  for (let i = 0; i < data.length; ++i) {
    chart.data.datasets[i].data.push(data[i].sentiment);
  }
  chart.data.datasets[data.length].data.push(mean);

  if (shouldRender) {
    renderChart(chart);
  }
}

export function renderChart(chart: Chart): void {
  syncChartLabels(chart);
  chart.update();
}

// The x-axis always spans the configured run length (step 0 = initial state),
// also when the number of steps is changed while the simulation runs.
function syncChartLabels(chart: Chart): void {
  const length = config.model.n_steps + 1;

  if (chart.data.labels?.length !== length) {
    chart.data.labels = [...Array(length).keys()];
  }
}

// More agents -> fainter individual lines, so dense bundles stay readable.
function agentAlpha(numAgents: number): number {
  return Math.max(0.12, Math.min(0.6, 40 / numAgents));
}
