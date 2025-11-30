import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
} 
from '@heroicons/react/24/outline';

// Helper to format venue display without repeating city when venue name already contains it
const formatVenue = (venue) => {
  if (!venue) return '';
  const name = (venue.name || '').trim();
  const city = (venue.address?.city || '').trim();
  if (!name) return city || '';
  if (!city) return name;
  const lname = name.toLowerCase();
  const lcity = city.toLowerCase();
  if (lname.includes(lcity) || lcity.includes(lname)) return name;
  return `${name}, ${city}`;
};

const FeaturedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        console.log('Fetching featured events...');
        const response = await eventsAPI.getEvents({ 
          limit: 3, 
          sort: '-createdAt',
          status: 'published',
          select: 'title,description,startDate,endDate,venue,category,ticketTypes,images' // Only fetch needed fields
        });
        console.log('Featured events response:', response.data);
        setEvents(response.data.events || []);
      } catch (error) {
        console.error('Error fetching featured events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

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
      'Music': 'bg-purple-600',
      'Business': 'bg-blue-600',
      'Food': 'bg-orange-600',
      'Sports': 'bg-green-600',
      'Entertainment': 'bg-pink-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Events</h2>
              <p className="text-lg text-gray-600">Don't miss out on these popular events</p>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
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
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Events</h2>
            <p className="text-lg text-gray-600">Don't miss out on these popular events</p>
          </div>
          <Link
            to="/events"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View All Events
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ₹{(Number(event.ticketTypes?.[0]?.price) || 0).toFixed(2)}
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
                    {formatVenue(event.venue)}
                  </div>
                </div>
                
                {/* Attendees removed from featured card; visible on event details only */}
                
                {/* View Details Button */}
                <Link
                  to={`/events/${event._id}`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
