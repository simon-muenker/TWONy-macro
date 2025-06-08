import Chart from "chart.js/auto";

export function createChart(
  canvas: HTMLCanvasElement,
  data: Array<number>,
): Chart {
  const canvasCTX: CanvasRenderingContext2D = canvas.getContext(
    "2d",
  ) as CanvasRenderingContext2D;

  return new Chart(canvasCTX, {
    type: "line",
    data: {
      labels: [0],
      datasets: [
        {
          label: "Average Sentiment",
          data: data,
          borderColor: "rgb(255, 255, 255)",
          fill: false,
          tension: 0.1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          display: false,
        },
      },
    },
  });
}
