import _ from "lodash";

import { config } from "./config";

// Bounded-confidence model of opinion dynamics with heterogeneous node-activity levels
// source: https://journals.aps.org/prresearch/abstract/10.1103/PhysRevResearch.5.023179

// II. OUR MODEL, A. The standard Deffuant-Weisbuch (DW) BCM, Figure 1
export function deffuant_weibach_bcm(xi: number, xj: number): number {
  if (Math.abs(xi - xj) < config.model.eps_bcm) {
    return xi + config.model.delta_bcm * (xj - xi);
  } else {
    return xi;
  }
}

// --- --- ---

// Neighbor-Selection Algorithm
export function select_neighbor(
  x: number,
  xns: Array<number | "" | undefined>,
  sorting: string,
): number {
  if (xns.length === 0) {
    console.error("No neighbors available for selection.");
    return -1;
  }

  const validXns = xns.filter((xi): xi is number => typeof xi === "number");

  switch (sorting) {
    case "random":
      return _.sample(validXns) as number;
    case "positivity":
      return _.max(validXns) as number;
    case "negativity":
      return _.min(validXns) as number;
    case "similarity":
      return _.minBy(validXns, (xi) => Math.abs(xi - x)) as number;
    default:
      console.error("Unknown sorting method:", sorting);
      return -1;
  }
}
