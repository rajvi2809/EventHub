import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Footer from '../components/Footer';
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const PublicProfile = () => {
  const { id } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const initials = useMemo(() => {
    const n = `${organizer?.firstName || ''} ${organizer?.lastName || ''}`.trim();
    if (!n) return 'JD';
    const [f, l] = n.split(' ');
    return `${(f || 'J')[0]}${(l || 'D')[0]}`.toUpperCase();
  }, [organizer]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // Use the public profile endpoint
        const response = await api.get(`/users/${id}/profile`);
        setOrganizer(response.data.user);
        
        // If user is an organizer, load their events
        if (response.data.user.role === 'organizer') {
          const eventsResponse = await api.get(`/users/${id}/events`, {
            params: { status: 'published' }
          });
          setEvents(eventsResponse.data.events || []);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <Link to="/events" className="text-blue-600 hover:text-blue-800">
              ← Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Event
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organizer.firstName} {organizer.lastName}
              </h1>
              <div className="flex gap-3 mt-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="w-4 h-4" /> Event Organizer
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" /> {events.length} Events Created
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Events by {organizer.firstName}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-white rounded-2xl">
              <p className="text-gray-600">No events created yet</p>
            </div>
          ) : (
            events.map((event) => (
              <Link 
                key={event._id} 
                to={`/events/${event._id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {event.images?.[0] && (
                    <img
                      src={event.images[0].url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      {event.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      {event.venue?.name}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfile;