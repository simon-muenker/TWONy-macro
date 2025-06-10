import Chart from "chart.js/auto";

export function createChart(
  canvas: HTMLCanvasElement,
  data: Array<number>,
): Chart {
  const ctx: CanvasRenderingContext2D = canvas.getContext(
    "2d",
  ) as CanvasRenderingContext2D;

  return new Chart(ctx, {
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

export function destroyChart(canvas: HTMLCanvasElement): void {
  const ctx: CanvasRenderingContext2D = canvas.getContext(
    "2d",
  ) as CanvasRenderingContext2D;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
