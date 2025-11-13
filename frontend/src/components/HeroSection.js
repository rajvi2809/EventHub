import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, BoltIcon } from '@heroicons/react/24/outline';

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image Effect */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-orange-900/30"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Discover Amazing Events
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-100">
          Find and book tickets to the best events happening around you
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/events"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
            <span>Explore Events</span>
          </Link>
          
          <Link
            to="/create-event"
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 hover:scale-105 text-gray-800 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <BoltIcon className="h-6 w-6" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white bg-opacity-10 rounded-full blur-lg"></div>
    </div>
  );
};

export default HeroSection;
