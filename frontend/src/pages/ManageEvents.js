import React, { useEffect, useState } from 'react';
import { eventsAPI, bookingsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Logout from '../components/Logout';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showBookingsFor, setShowBookingsFor] = useState(null);
  const [showAnalyticsFor, setShowAnalyticsFor] = useState(null);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events for all statuses since backend expects a specific status value
      const statuses = ['draft', 'published', 'cancelled', 'completed'];
      const promises = statuses.map((s) => eventsAPI.getAll({ status: s, limit: 1000 }));
      const results = await Promise.allSettled(promises);

      const map = new Map();
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          const list = (r.value.data.events || r.value.data || []);
          list.forEach((ev) => map.set(ev._id, ev));
        }
      });

      setEvents(Array.from(map.values()));
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await eventsAPI.updateEvent(id, { status });
      fetchEvents();
    } catch (err) {
      console.error('Error changing status:', err);
      alert(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.deleteEvent(id);
        alert('Event deleted');
        fetchEvents();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Error deleting event');
      }
    }
  };

  const openBookings = async (eventId) => {
    try {
      const res = await bookingsAPI.getEventBookings(eventId);
      setBookings(res.data.bookings || res.data || []);
      setShowBookingsFor(eventId);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      alert('Failed to fetch bookings');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingsAPI.cancelBooking(bookingId);
      alert('Booking cancelled');
      // refresh bookings list
      if (showBookingsFor) openBookings(showBookingsFor);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const closeBookings = () => {
    setShowBookingsFor(null);
    setBookings([]);
  };

  const openAnalytics = async (eventId) => {
    try {
      const res = await eventsAPI.getEventAnalytics(eventId);
      setAnalytics(res.data.analytics || res.data || null);
      setShowAnalyticsFor(eventId);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      alert('Failed to fetch analytics');
    }
  };

  const closeAnalytics = () => {
    setShowAnalyticsFor(null);
    setAnalytics(null);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Back to Dashboard</button>
          <Logout />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">Title</th>
              <th className="p-3 border text-left">Organizer</th>
              <th className="p-3 border text-left">Status</th>
              <th className="p-3 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="p-6 text-center">Loading...</td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center">No events found</td>
              </tr>
            )}
            {events.map((event) => (
              <tr key={event._id}>
                <td className="p-3 border">{event.title}</td>
                <td className="p-3 border">
                  {event.organizer?.firstName} {event.organizer?.lastName}
                </td>
                <td className="p-3 border capitalize">
                  <select
                    value={event.status}
                    onChange={(e) => changeStatus(event._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                      <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td className="p-3 border">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="bg-gray-600 text-white px-3 py-1 rounded"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openBookings(event._id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded"
                    >
                      Bookings
                    </button>
                    <button
                      onClick={() => openAnalytics(event._id)}
                      className="bg-teal-600 text-white px-3 py-1 rounded"
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bookings modal */}
      {showBookingsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center p-6">
          <div className="bg-white rounded-lg shadow max-w-3xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Bookings for event</h2>
              <button onClick={closeBookings} className="text-gray-600">Close</button>
            </div>
            <div className="max-h-96 overflow-auto">
              {bookings.length === 0 && <p>No bookings found.</p>}
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border">Booking ID</th>
                    <th className="p-2 border">User</th>
                    <th className="p-2 border">Tickets</th>
                    <th className="p-2 border">Amount</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td className="p-2 border">{b._id}</td>
                      <td className="p-2 border">{b.user?.firstName} {b.user?.lastName}</td>
                      <td className="p-2 border">{b.totalTickets}</td>
                      <td className="p-2 border">{b.finalAmount}</td>
                      <td className="p-2 border">{b.status}</td>
                      <td className="p-2 border">
                        {b.status !== 'cancelled' && (
                          <button onClick={() => handleCancelBooking(b._id)} className="bg-yellow-500 text-white px-2 py-1 rounded">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics modal */}
      {showAnalyticsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center p-6">
          <div className="bg-white rounded-lg shadow max-w-3xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Analytics</h2>
              <button onClick={closeAnalytics} className="text-gray-600">Close</button>
            </div>
            <div>
              {!analytics && <p>No analytics available.</p>}
              {analytics && (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Views</div>
                      <div className="text-2xl font-bold">{analytics.overview.totalViews}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Bookings</div>
                      <div className="text-2xl font-bold">{analytics.overview.totalBookings}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Revenue</div>
                      <div className="text-2xl font-bold">{analytics.overview.totalRevenue}</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">Ticket Sales</h3>
                  <table className="min-w-full mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 border">Ticket</th>
                        <th className="p-2 border">Sold</th>
                        <th className="p-2 border">Revenue</th>
                        <th className="p-2 border">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.ticketSales.map((t) => (
                        <tr key={t.name}>
                          <td className="p-2 border">{t.name}</td>
                          <td className="p-2 border">{t.sold}</td>
                          <td className="p-2 border">{t.revenue}</td>
                          <td className="p-2 border">{t.remaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
