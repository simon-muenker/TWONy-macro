import _ from "lodash";

export interface NodeData {
  sentiment: number;
}

export function generateNodeData(num: number) {
  return [...Array(num).keys()].map(() => ({
    sentiment: _.random(0, 1, true),
  }));
}

export function generateNodes(num: number, data: Array<NodeData>) {
  return [...Array(num).keys()].map((i) => ({ id: i, data: data[i] }));
}

export function generateLinks(numNodes: number, numLinksPerNode: number = 2) {
  const links: Array<{ source: number; target: number }> = [];

  for (let source: number = 0; source < numNodes; source++) {
    const numLinksForNode = Math.min(numLinksPerNode, source);
    const targets = new Set<number>();

    while (targets.size < numLinksForNode) {
      const target = _.random(0, numNodes - 1, false);
      targets.add(target);
    }

    targets.forEach((target) => {
      links.push({ source, target });
    });
  }

  return links;
}
