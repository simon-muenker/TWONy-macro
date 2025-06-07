export function generateNodeData(num: Number) {
    return [...Array(num).keys()].map(_ => ({ sentiment: Math.random() }));
}

export function generateNodes(num: Number, data: Array<any>) {
    return [...Array(num).keys()].map(i => ({ id: i, data: data[i] }));
}

export function generateLinks(num: Number) {
    return [...Array(num).keys()]
        .filter(id => id)
        .map(id => ({
            source: id,
            target: Math.round(Math.random() * (id-1))
        }));
}