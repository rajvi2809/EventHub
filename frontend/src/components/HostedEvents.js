import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../services/api';
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const HostedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventsAPI.getEvents({ status: 'completed', limit: 6 });
        setEvents(res.data.events || []);
      } catch (err) {
        console.error('Failed to load hosted events', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="h-24 bg-white rounded-xl shadow animate-pulse" />;
  if (!events.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Hosted Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gray-200 relative">
              {event.images?.[0] && (
                <img src={event.images[0].url} alt={event.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{event.venue?.name}</p>
              <div className="mt-3 text-sm text-gray-500 flex items-center gap-4">
                <span className="inline-flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {new Date(event.startDate).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><UserIcon className="w-4 h-4" /> {event.totalTicketsSold || 0} attended</span>
              </div>
              <div className="mt-4 flex justify-between">
                <Link to={`/events/${event._id}`} className="px-3 py-2 bg-blue-600 text-white rounded">View</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HostedEvents;
