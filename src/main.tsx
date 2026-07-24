import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// StrictMode is intentionally left off: it double-mounts effects in dev, which
// would spin up the WebGL context twice and skip the hero's first-draw
// animation. Nothing here depends on it.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
