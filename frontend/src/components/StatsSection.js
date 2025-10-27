import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';

const StatsSection = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalCities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats...');
        // Fetch total events
        const eventsResponse = await eventsAPI.getEvents({ limit: 1 });
        console.log('Stats events response:', eventsResponse.data);
        const totalEvents = eventsResponse.data.total;

        // Calculate total attendees (sum of all event views)
        const allEventsResponse = await eventsAPI.getEvents({ limit: 1000 });
        console.log('All events response:', allEventsResponse.data);
        const totalAttendees = allEventsResponse.data.events.reduce(
          (sum, event) => sum + (event.analytics?.views || 0), 
          0
        );

        // Get unique cities
        const cities = new Set();
        allEventsResponse.data.events.forEach(event => {
          if (event.venue?.address?.city) {
            cities.add(event.venue.address.city);
          }
        });

        console.log('Final stats:', { totalEvents, totalAttendees, totalCities: cities.size });
        setStats({
          totalEvents: totalEvents,
          totalAttendees: totalAttendees,
          totalCities: cities.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          totalEvents: 0,
          totalAttendees: 0,
          totalCities: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-16 w-24 bg-white bg-opacity-20 rounded mx-auto mb-4"></div>
                <div className="h-6 w-32 bg-white bg-opacity-20 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          <div>
            <div className="text-5xl font-bold mb-2">
              {formatNumber(stats.totalEvents)}
            </div>
            <div className="text-xl text-blue-100">
              Events Hosted
            </div>
          </div>
          <div>
            <div className="text-5xl font-bold mb-2">
              {formatNumber(stats.totalAttendees)}
            </div>
            <div className="text-xl text-blue-100">
              Happy Attendees
            </div>
          </div>
          <div>
            <div className="text-5xl font-bold mb-2">
              {stats.totalCities}+
            </div>
            <div className="text-xl text-blue-100">
              Cities Covered
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
