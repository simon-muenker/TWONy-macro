import Chart from "chart.js/auto";

import { config } from "@logic/config.ts";
import type { NodeData } from "@logic/generator.ts";

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
      elements: {
        point: {
          radius: 0,
        },
      },
      scales: {
        y: {
          min: 0.0,
          max: 1.0,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

export function prepareChart(chart: Chart, data: Array<NodeData>): void {
  chart.data.datasets = [];
  chart.data.labels = [...Array(config.model.n_steps).keys()];

  for (let i = 0; i < config.network.n_agents; ++i) {
    chart.data.datasets.push(formatDataset([data[i].sentiment]));
  }
  chart.update();
}

export function updateChartData(chart: Chart, data: Array<NodeData>) {
  for (let i = 0; i < chart.data.datasets.length; ++i) {
    chart.data.datasets[i].data.push(data[i].sentiment);
  }
  chart.update();
}

export function formatDataset(data: Array<number>) {
  return {
    label: "_",
    data: data,
    borderColor: "rgb(255, 255, 255)",
    borderWidth: 0.5,
    fill: false,
    tension: 0.1,
  };
}
