import { EstimateProvider } from "./EstimateContext";
import Nav from "./Nav";
import Hero from "./Hero";
import StatsBar from "./StatsBar";
import Services from "./Services";
import Fleet from "./Fleet";
import Protocol from "./Protocol";
import CaseStudies from "./CaseStudies";
import Contact from "./Contact";
import Footer from "./Footer";
import MobileCTA from "./MobileCTA";
import "./land-clearing.css";

export function LandClearingExperience() {
  return (
    <EstimateProvider>
      <div className="land-clearing-root">
        <Nav />
        <main>
          <Hero />
          <StatsBar />
          <Services />
          <Fleet />
          <Protocol />
          <CaseStudies />
          <Contact />
        </main>
        <Footer />
        <MobileCTA />
      </div>
    </EstimateProvider>
  );
}
