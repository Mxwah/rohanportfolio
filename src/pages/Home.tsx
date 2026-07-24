import { DcfHero } from "../components/hero/DcfHero";
import { Education } from "../components/sections/Education";
import { ExperienceAct } from "../acts/ExperienceAct";
import { SimulatorAct } from "../acts/SimulatorAct";
import { MacroAct } from "../acts/MacroAct";
import { AriaAct } from "../acts/aria/AriaAct";
import { MontAi } from "../components/sections/MontAi";
import { Leadership } from "../components/sections/Leadership";
import { Contact } from "../components/sections/Contact";

// The one-page story: the live model, education, the pinned experience
// sequence, the simulator, the macro model, Mont AI, ARIA as the crescendo
// (the river drains into its rising stage), then selections and contact.
export function Home() {
  return (
    <>
      <DcfHero />
      <Education />
      <ExperienceAct />
      <SimulatorAct />
      <MacroAct />
      <MontAi />
      <AriaAct />
      <Leadership />
      <Contact />
    </>
  );
}
