# TWONy (macro) - an OSN Simulation

A macro-simulation of the impact of social network mechanics on opinion dynamics and sentiment evolution. This interactive demonstration shows how network topology and algorithmic choices affect opinion formation in online communities by simulating virtual agents with evolving sentiment states in a 3D network visualization.

## Overview

TWONy-macro is an educational tool that visualizes how network structure and recommendation algorithms shape opinion dynamics in online communities. Users can:

- **Watch virtual agents interact** in a 3D network environment with real-time opinion evolution
- **Experiment with different sorting algorithms** for neighbor selection (random, similarity-based, positivity/negativity bias)
- **Customize network parameters** including agent count and connectivity patterns
- **Analyze opinion convergence** through real-time sentiment tracking and visualization
- **Observe emergent behaviors** like opinion clustering and polarization dynamics

## Features

### Opinion Dynamics Model

- Implements the Deffuant-Weisbuch Bounded Confidence Model (BCM)
- Configurable confidence thresholds and influence parameters
- Multiple neighbor selection strategies affecting opinion evolution
- Real-time sentiment state updates for all network agents

### 3D Network Visualization

- Interactive 3D force-directed graph using Three.js
- Color-coded nodes representing sentiment states (red-yellow-green scale)
- Dynamic visual updates showing opinion changes over time
- Optional bloom effects for enhanced visual appeal
- Orbit controls for 3D navigation

### Algorithm Comparison

- **Random selection**: Traditional random neighbor interaction
- **Similarity-based**: Agents preferentially interact with similar opinions
- **Positivity bias**: Agents preferentially interact with more positive neighbors
- **Negativity bias**: Agents preferentially interact with more negative neighbors

### Network Configuration

- Adjustable network size (5-500 agents)
- Variable neighbor connectivity (1-5 neighbors per agent)
- Random regular graph topology generation
- Real-time network regeneration with parameter changes

### Data Visualization

- Live chart showing average network sentiment over time
- Real-time progress tracking and evaluation metrics
- Interactive GUI controls for parameter adjustment
- Step-by-step simulation control (start, pause, reset)

### Simulation Management

- Configurable simulation length (50-1000 steps)
- Real-time parameter adjustment during simulation
- Session state management
- Performance-optimized rendering and computation

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/simon-muenker/TWONy-macro.git
   cd TWONy-macro
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to `localhost:4321/TWONy-macro`

## Usage

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run prettier`        | Format code with Prettier                        |

## Privacy & Data

- **All processing happens in your browser** - no external data transmission
- **No user tracking or analytics** are implemented
- **Simulation runs entirely client-side** using JavaScript and WebGL
- **No API keys or external services** required for operation
- **Simulation parameters can be adjusted** in real-time through the GUI

## Technical Details

### Architecture

- **Frontend**: Astro.js framework with TypeScript
- **3D Graphics**: Three.js with force-directed graph layout
- **Visualization**: Chart.js for time series data
- **UI Controls**: Tweakpane for parameter adjustment
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Reactive configuration system

## Relevant Sources

- **Frontend**: Astro.js with TypeScript
- **3D Graphics**: Three.js and 3d-force-graph
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **UI Controls**: Tweakpane with essentials plugin
- **Utilities**: Lodash for data manipulation
- **Color Scales**: D3.js interpolation functions

---

_This work is supported by TWON (project number 101095095), a research project funded by the European Union under the Horizon framework (HORIZON-CL2-022-DEMOCRACY-01-07)._
