import { lazy, Suspense, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useSmoothScroll } from "./lib/useSmoothScroll";
import { CustomCursor } from "./components/cursor/CustomCursor";
import { OpeningScene } from "./components/opening/OpeningScene";
import { Nav } from "./components/layout/Nav";
import { Home } from "./pages/Home";
import { DcfPage } from "./pages/DcfPage";

// The river pulls in three.js and the bloom composer, so it loads after first
// paint instead of riding in the initial bundle. Until it arrives the flat
// background stands in, which is also the permanent state without WebGL.
const FlowField = lazy(() =>
  import("./components/background/FlowField").then((m) => ({ default: m.FlowField })),
);

// App shell: ambient WebGL field, grain, custom cursor, nav, and the smooth-scroll
// engine wrap every route. The opening scene plays once, on the home route only.
export default function App() {
  useSmoothScroll();
  const location = useLocation();
  const [introDone, setIntroDone] = useState(false);
  const showIntro = location.pathname === "/" && !introDone;

  return (
    <>
      <Suspense fallback={null}>
        <FlowField />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <CustomCursor hidden={showIntro} />
      {showIntro && <OpeningScene onFinish={() => setIntroDone(true)} />}
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dcf" element={<DcfPage />} />
        </Routes>
      </main>
    </>
  );
}
