import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const Events = () => {
  const { isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get category from URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
          setSelectedCategory(categoryParam);
        }

        // Try to get cached data first
        const cachedCategories = localStorage.getItem('eventCategories');
        const cachedEvents = localStorage.getItem('eventsList');
        
        if (cachedCategories) {
          try {
            setCategories(JSON.parse(cachedCategories));
          } catch (e) {
            console.warn('Invalid cached categories, clearing cache', e);
            try { localStorage.removeItem('eventCategories'); } catch (err) {}
          }
        }
        if (cachedEvents) {
          try {
            const parsedEvents = JSON.parse(cachedEvents);
            setEvents(parsedEvents.events || []);
            setTotalEvents(parsedEvents.total || (parsedEvents.events ? parsedEvents.events.length : 0));
          } catch (e) {
            console.warn('Invalid cached events, clearing eventsList', e);
            try { localStorage.removeItem('eventsList'); } catch (err) {}
          }
        }

        // Fetch fresh data
        const categoriesResponse = await eventsAPI.getCategories();
        const categories = categoriesResponse.data.categories;
        setCategories(categories);
        localStorage.setItem('eventCategories', JSON.stringify(categories));

        // Fetch events
        const params = {
          limit: 20
        };
        
        const categoryToUse = categoryParam || selectedCategory;
        if (categoryToUse !== 'all') {
          params.category = categoryToUse;
        }

        const eventsResponse = await eventsAPI.getEvents(params);
        const eventData = {
          events: eventsResponse.data.events || eventsResponse.data || [],
          total: eventsResponse.data.total || (eventsResponse.data.events ? eventsResponse.data.events.length : 0)
        };
        setEvents(eventData.events);
        setTotalEvents(eventData.total);
        localStorage.setItem('eventsList', JSON.stringify(eventData));

      } catch (error) {
        console.error('Error fetching data:', error);
        // Data is preserved through localStorage even if error occurs
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, isAuthenticated, user]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await eventsAPI.searchEvents({ q: searchTerm });
      setEvents(response.data.events);
      setTotalEvents(response.data.total);
    } catch (error) {
      console.error('Search error:', error);
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Music': 'bg-blue-600',
      'Business': 'bg-blue-600',
      'Food': 'bg-orange-600',
      'Sports': 'bg-green-600',
      'Art': 'bg-purple-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  const getPriceColor = (price) => {
    if (price === 0) return 'bg-green-600';
    if (price < 50) return 'bg-blue-600';
    if (price < 100) return 'bg-orange-600';
    return 'bg-red-600';
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Events</h1>
          <p className="text-lg text-gray-600">Browse through thousands of exciting events happening near you</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="lg:w-32">
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="0-50">$0 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100+">$100+</option>
              </select>
            </div>

            {/* Filter Button */}
            <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 hover:scale-105 text-gray-700 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md">
              <FunnelIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">Showing {totalEvents} events</p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500 overflow-hidden">
                  {event.images && event.images[0] && (
                    <img
                      src={event.images[0].url}
                      alt={event.images[0].alt || event.title}
                      className="w-full h-full object-cover transition-transform hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                      }}
                    />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`${getCategoryColor(event.category)} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {event.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`${getPriceColor(event.ticketTypes?.[0]?.price || 0)} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {event.ticketTypes?.[0]?.price === 0 ? 'Free' : `₹${(Number(event.ticketTypes?.[0]?.price) || 0).toFixed(2)}`}
                    </span>
                  </div>
                </div>
                
                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  {/* Event Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDate(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formatTime(event.startDate)} - {formatTime(event.endDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {event.venue?.name}, {event.venue?.address?.city}
                    </div>
                  </div>
                  
                  {/* Attendees removed from event card; shown on event details only */}
                  
                  {/* View Details Button */}
                  <Link
                    to={`/events/${event._id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white text-center py-3 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {events.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
              Load More Events
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Events;