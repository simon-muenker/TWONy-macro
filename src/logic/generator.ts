import _ from "lodash";

export interface NodeData {
  sentiment: number;
}

export interface NodeLink {
  source: number;
  target: number;
}

export function generateNodeData(num: number): Array<NodeData> {
  return [...Array(num).keys()].map(() => ({
    sentiment: _.random(0, 1, true),
  }));
}

export function generateNodes(num: number, data: Array<NodeData>) {
  return [...Array(num).keys()].map((i) => ({ id: i, data: data[i] }));
}

// Every agent follows `numLinksPerNode` distinct other agents (regular
// out-degree, random targets).
export function generateLinks(
  numNodes: number,
  numLinksPerNode: number = 2,
): Array<NodeLink> {
  const links: Array<NodeLink> = [];

  // an agent cannot follow more agents than exist besides itself
  const degree = Math.max(0, Math.min(numLinksPerNode, numNodes - 1));

  for (let source: number = 0; source < numNodes; source++) {
    const targets = new Set<number>();

    while (targets.size < degree) {
      const target = _.random(0, numNodes - 1, false);
      if (target !== source) {
        targets.add(target);
      }
    }

    targets.forEach((target) => {
      links.push({ source, target });
    });
  }

  return links;
}
