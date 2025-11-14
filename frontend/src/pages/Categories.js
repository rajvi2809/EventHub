import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { eventsAPI } from '../services/api';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  StarIcon,
  MusicalNoteIcon,
  BuildingOfficeIcon,
  CakeIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesAndCounts = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await eventsAPI.getCategories();
        const categoriesData = categoriesResponse.data.categories;

        // Fetch event counts for each category
        const counts = {};
        for (const category of categoriesData) {
          try {
            const eventsResponse = await eventsAPI.getEvents({ 
              category: category.value, 
              limit: 1 
            });
            counts[category.value] = eventsResponse.data.total;
          } catch (error) {
            counts[category.value] = 0;
          }
        }

        setCategories(categoriesData);
        setEventCounts(counts);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setEventCounts({});
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndCounts();
  }, []);

  const getCategoryIcon = (categoryValue) => {
    const iconMap = {
      concert: <MusicalNoteIcon className="h-8 w-8 text-white" />,
      conference: <BuildingOfficeIcon className="h-8 w-8 text-white" />,
      festival: <CakeIcon className="h-8 w-8 text-white" />,
      sports: <TrophyIcon className="h-8 w-8 text-white" />,
      exhibition: <StarIcon className="h-8 w-8 text-white" />,
      workshop: <ChartBarIcon className="h-8 w-8 text-white" />,
      seminar: <CalendarIcon className="h-8 w-8 text-white" />,
      networking: <UserGroupIcon className="h-8 w-8 text-white" />,
      webinar: <CalendarIcon className="h-8 w-8 text-white" />,
      meetup: <UserGroupIcon className="h-8 w-8 text-white" />,
      other: <CalendarIcon className="h-8 w-8 text-white" />,
    };
    return iconMap[categoryValue] || <CalendarIcon className="h-8 w-8 text-white" />;
  };

  const getCategoryGradient = (categoryValue) => {
    const gradients = {
      concert: 'from-blue-500 to-purple-600',
      conference: 'from-purple-500 to-blue-600',
      festival: 'from-orange-500 to-red-500',
      sports: 'from-orange-500 to-red-500',
      exhibition: 'from-pink-500 to-purple-500',
      workshop: 'from-purple-500 to-pink-500',
      seminar: 'from-blue-500 to-purple-600',
      networking: 'from-purple-500 to-blue-600',
      webinar: 'from-blue-500 to-purple-600',
      meetup: 'from-purple-500 to-blue-600',
      other: 'from-gray-500 to-gray-600',
    };
    return gradients[categoryValue] || 'from-blue-500 to-purple-600';
  };

  const getCategoryDescription = (categoryValue) => {
    const descriptions = {
      concert: 'Live performances, concerts, and music festivals',
      conference: 'Business conferences, tech talks, and professional events',
      festival: 'Cultural festivals, food events, and celebrations',
      sports: 'Sporting events, fitness classes, and competitions',
      exhibition: 'Art exhibitions, galleries, and cultural displays',
      workshop: 'Hands-on learning, skill development, and training',
      seminar: 'Educational seminars, lectures, and presentations',
      networking: 'Professional networking, meetups, and social events',
      webinar: 'Online workshops, virtual events, and digital learning',
      meetup: 'Community meetups, social gatherings, and local events',
      other: 'Various events and activities',
    };
    return descriptions[categoryValue] || 'Various events and activities';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h1>
            <p className="text-lg text-gray-600">Find events that match your interests</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-red-500 bg-clip-text text-transparent mb-6">
            Event Categories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover amazing events across all categories. From music festivals to tech conferences, find what excites you.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.value}
              to={`/events?category=${category.value}`}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 p-8 group cursor-pointer border border-gray-100"
            >
              {/* Icon with gradient background */}
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getCategoryGradient(category.value)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {getCategoryIcon(category.value)}
                </div>
              </div>
              
              {/* Category title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                {category.label}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {getCategoryDescription(category.value)}
              </p>
              
              {/* Event count and explore link */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">
                  {eventCounts[category.value] || 0} events
                </span>
                <span className="text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors duration-300">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Categories;
