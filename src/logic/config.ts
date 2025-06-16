export let config = {
  network: {
    n_agents: 150,
    n_neighbors: 2,
  },
  model: {
    sorting: "random",
    n_steps: 500,
    eps_bcm: 0.2,
    eps_rei: 0.0,
    delta_bcm: 0.1,
  },
  utilities: {
    bloomFilter: true,
    backgroundColor: "#000",
  },
  state: {
    running: false,
    current_step: 0,
    current_evaluation: 0.0,
  },
};
