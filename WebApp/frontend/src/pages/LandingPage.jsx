import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import ProblemSection from '../components/sections/ProblemSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import ReasonsSection from '../components/sections/ReasonsSection';
import FooterSection from '../components/sections/FooterSection';

import PartnersSection from '../components/sections/PartnersSection';
import ServicesHubSection from '../components/sections/ServicesHubSection';
import CaseStudiesSection from '../components/sections/CaseStudiesSection';
import ShowcaseSection from '../components/sections/ShowcaseSection';

const LandingPage = () => {
  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <HeroSection />
      <PartnersSection />
      <ServicesHubSection />
      <ShowcaseSection />
      <CaseStudiesSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ReasonsSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
