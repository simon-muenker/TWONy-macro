export let config = {
  network: {
    n_agents: 150,
    n_neighbors: 2,
  },
  model: {
    sorting: "random",
    n_steps: 500,
    eps_bcm: 0.4,
    eps_rei: 0.0,
    delta_bcm: 0.2,
  },
  utilities: {
    bloomFilter: true,
    backgroundColor: "#000",
  },
};
