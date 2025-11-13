import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  StarIcon 
} from '@heroicons/react/24/outline';

const CategorySection = () => {
  const [categories, setCategories] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesAndCounts = async () => {
      try {
        console.log('Fetching categories...');
        // Fetch categories
        const categoriesResponse = await eventsAPI.getCategories();
        console.log('Categories response:', categoriesResponse.data);
        const categoriesData = categoriesResponse.data.categories;

        // Fetch event counts for each category
        const counts = {};
        for (const category of categoriesData) {
          try {
            const eventsResponse = await eventsAPI.getEvents({ 
              category: category.value, 
              limit: 1 
            });
            console.log(`Events for ${category.value}:`, eventsResponse.data);
            counts[category.value] = eventsResponse.data.total;
          } catch (error) {
            console.log(`No events found for category ${category.value}`);
            counts[category.value] = 0;
          }
        }

        console.log('Final counts:', counts);
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
      concert: <CalendarIcon className="h-8 w-8 text-white" />,
      networking: <UserGroupIcon className="h-8 w-8 text-white" />,
      conference: <ChartBarIcon className="h-8 w-8 text-white" />,
      festival: <StarIcon className="h-8 w-8 text-white" />,
    };
    return iconMap[categoryValue] || <CalendarIcon className="h-8 w-8 text-white" />;
  };

  const getCategoryGradient = (categoryValue) => {
    const gradients = {
      concert: 'from-blue-500 to-purple-600',
      networking: 'from-purple-500 to-blue-600',
      conference: 'from-orange-500 to-red-500',
      festival: 'from-pink-500 to-purple-500',
    };
    return gradients[categoryValue] || 'from-blue-500 to-purple-600';
  };

  const featuredCategories = categories;

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-lg text-gray-600">Find events that match your interests</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-lg text-gray-600">Find events that match your interests</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCategories.map((category) => (
            <Link
              key={category.value}
              to={`/events?category=${category.value}`}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 p-6 text-center group cursor-pointer border border-gray-100"
            >
              <div className="flex justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getCategoryGradient(category.value)} flex items-center justify-center shadow-lg`}>
                  {getCategoryIcon(category.value)}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                {category.label}
              </h3>
              <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                {eventCounts[category.value] || 0} Events
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
