import React from 'react';
import HeroSection from '../components/HeroSection';
import CategorySection from '../components/CategorySection';
import FeaturedEvents from '../components/FeaturedEvents';
import HostedEvents from '../components/HostedEvents';
import StatsSection from '../components/StatsSection';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100">
      <main>
        <HeroSection />
        <CategorySection />
  <FeaturedEvents />
  <HostedEvents />
        <StatsSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
