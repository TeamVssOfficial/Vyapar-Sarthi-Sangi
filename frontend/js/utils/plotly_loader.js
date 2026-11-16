// On-demand non-blocking Plotly loader

let plotlyPromise = null;

export function ensurePlotly() {
  if (window.Plotly) {
    return Promise.resolve(window.Plotly);
  }
  if (plotlyPromise) {
    return plotlyPromise;
  }

  plotlyPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.plot.ly/plotly-2.35.2.min.js";
    script.async = true;
    script.onload = () => {
      resolve(window.Plotly);
    };
    script.onerror = () => {
      console.warn("Could not load Plotly from CDN.");
      resolve(null);
    };
    document.body.appendChild(script);
  });

  return plotlyPromise;
}
