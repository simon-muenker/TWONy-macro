import type { Sorting } from "./config";

// Bounded-confidence model of opinion dynamics with heterogeneous node-activity levels
// source: https://journals.aps.org/prresearch/abstract/10.1103/PhysRevResearch.5.023179

// II. OUR MODEL, A. The standard Deffuant-Weisbuch (DW) BCM, Figure 1
export function deffuant_weisbuch_bcm(
  xi: number,
  xj: number,
  eps: number,
  delta: number,
): number {
  if (Math.abs(xi - xj) < eps) {
    return xi + delta * (xj - xi);
  } else {
    return xi;
  }
}

// --- --- ---

// Neighbor-Selection Algorithm: which of the followed agents gets "recommended"
// as the interaction partner for this step.
export function select_neighbor(
  x: number,
  neighbors: ArrayLike<number>,
  sentiments: ArrayLike<number>,
  sorting: Sorting,
): number {
  if (neighbors.length === 0) {
    return x;
  }

  switch (sorting) {
    case "random":
      return sentiments[
        neighbors[Math.floor(Math.random() * neighbors.length)]
      ];
    case "positivity": {
      let max = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < neighbors.length; i++) {
        max = Math.max(max, sentiments[neighbors[i]]);
      }
      return max;
    }
    case "negativity": {
      let min = Number.POSITIVE_INFINITY;
      for (let i = 0; i < neighbors.length; i++) {
        min = Math.min(min, sentiments[neighbors[i]]);
      }
      return min;
    }
    case "similarity": {
      let closest = sentiments[neighbors[0]];
      for (let i = 1; i < neighbors.length; i++) {
        const candidate = sentiments[neighbors[i]];
        if (Math.abs(candidate - x) < Math.abs(closest - x)) {
          closest = candidate;
        }
      }
      return closest;
    }
    default:
      return x;
  }
}

// --- --- ---

export interface Metrics {
  mean: number; // average network sentiment
  spread: number; // standard deviation of the sentiments
  clusters: number; // number of separated opinion groups
}

// Two agents belong to the same opinion cluster if no gap larger than this
// separates them on the sentiment axis.
export const CLUSTER_GAP = 0.05;

export function computeMetrics(sentiments: ArrayLike<number>): Metrics {
  const n = sentiments.length;

  if (n === 0) {
    return { mean: 0, spread: 0, clusters: 0 };
  }

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += sentiments[i];
  }
  const mean = sum / n;

  let squares = 0;
  for (let i = 0; i < n; i++) {
    squares += (sentiments[i] - mean) ** 2;
  }

  const sorted = Float64Array.from(sentiments).sort();
  let clusters = 1;
  for (let i = 1; i < n; i++) {
    if (sorted[i] - sorted[i - 1] > CLUSTER_GAP) {
      clusters++;
    }
  }

  return { mean, spread: Math.sqrt(squares / n), clusters };
}
