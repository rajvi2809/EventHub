import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, eventsAPI } from '../services/api';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-gray-100 text-gray-900' : 'bg-transparent text-gray-600 hover:bg-gray-50'
    }`}
  >
    {children}
  </button>
);

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  // Set initial tab without depending on user role to avoid state updates during render
  const [activeTab, setActiveTab] = useState('tickets');
  const [bookings, setBookings] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const downloadTicket = (b) => {
    const attendees = b?.attendees || [];
    const eventImage = b?.event?.images?.[0]?.url || '';
    const organizerName = b?.event?.organizer ? `${b.event.organizer.firstName || ''} ${b.event.organizer.lastName || ''}` : '';
    const html = `
      <html>
        <head>
          <title>Ticket - ${b?.event?.title}</title>
          <style>
            body{ font-family: Arial, sans-serif; padding: 24px; background:#f8fafc }
            .ticket{ max-width:800px; margin:0 auto; border:1px solid #e5e7eb; padding:20px; border-radius:8px; background:#fff }
            h1{ margin:0 0 8px 0 }
            .meta{ color:#374151 }
            .badge{ display:inline-block; padding:6px 10px; background:#ecfdf5; color:#065f46; border-radius:9999px; font-weight:600 }
            .section{ margin-top:16px }
            .attendee{ margin-top:8px }
            .event-img{ width:120px; height:80px; object-fit:cover; border-radius:6px }
            .header-row{ display:flex; gap:16px; align-items:center }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <div>
                <h1>Ticket - ${b?.event?.title}</h1>
                <div class="meta">Booking #: <strong>${b?.bookingNumber || ''}</strong></div>
                <div class="meta">Status: <strong>${b?.status || ''}</strong></div>
              </div>
              ${eventImage ? `<img src="${eventImage}" class="event-img" alt="Event image" />` : ''}
            </div>
            <div class="section header-row">
              <div>
                <div class="meta">Event: <strong>${b?.event?.title}</strong></div>
                <div class="meta">When: <strong>${b?.event?.startDate ? new Date(b.event.startDate).toLocaleString() : ''}</strong></div>
                <div class="meta">Where: <strong>${b?.event?.venue?.name || ''}</strong></div>
                ${organizerName ? `<div class="meta">Organized by: <strong>${organizerName}</strong></div>` : ''}
              </div>
            </div>
            <div class="section">
              <h3>Attendees</h3>
              ${attendees.length > 0 ? attendees.map(a => `
                <div class="attendee">${a.firstName || a.name || ''} ${a.lastName || ''} - Ticket: ${a.ticketCode || ''} ${a.email ? `- ${a.email}` : ''}</div>
              `).join('') : '<div class="attendee">(No attendee details)</div>'}
            </div>
            <div class="section" style="margin-top:20px; text-align:center">
              <small class="meta">Please present this ticket at event entry.</small>
            </div>
          </div>
          <script>
            window.onload = function(){ window.print(); };
          </script>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      alert('Please allow popups to download the ticket.');
    }
  };

  // Update active tab when user role changes
  useEffect(() => {
    if (user?.role === 'organizer') {
      setActiveTab('created');
    }
  }, [user?.role]);

  const initials = useMemo(() => {
    const n = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    if (!n) return (user?.email || 'JD').slice(0, 2).toUpperCase();
    const [f, l] = n.split(' ');
    return `${(f || 'J')[0]}${(l || 'D')[0]}`.toUpperCase();
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      // Only load if authenticated and we have user data
      if (!isAuthenticated || !user) return;
      
      setLoading(true);
      try {
        if (user.role === 'organizer') {
          const eventsRes = await eventsAPI.getOrganizerEvents();
          // Check if component is still mounted before updating state
          if (isMounted) {
            setCreatedEvents(eventsRes.data.events || []);
            setBookings([]); // Clear bookings for organizers
          }
        } else {
          const bookingsRes = await bookingsAPI.getUserBookings();
          // Check if component is still mounted before updating state
          if (isMounted) {
            setBookings(bookingsRes.data.bookings || []);
            setCreatedEvents([]); // Clear events for attendees
          }
        }
      } catch (error) {
        // Only show error if component is still mounted
        if (isMounted && error?.response?.status !== 429) {
          console.error('Error loading profile data:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    // Cleanup function to prevent memory leaks and state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]); // Only depend on user object and auth state

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"><CalendarIcon className="w-4 h-4" /> {bookings.length} Events Attended</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/edit-profile" className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Cog6ToothIcon className="w-5 h-5" /> Edit Profile</Link>
              <button onClick={logout} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><ArrowRightOnRectangleIcon className="w-5 h-5" /> Logout</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-2 mb-6 flex">
          {user?.role !== 'organizer' && (
            <>
              <TabButton active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')}>My Tickets</TabButton>
              <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>Favorites</TabButton>
            </>
          )}
          {user?.role === 'organizer' && (
            <TabButton active={activeTab === 'created'} onClick={() => setActiveTab('created')}>Created Events</TabButton>
          )}
        </div>

        {/* Content */}
        {activeTab === 'tickets' && (
          <section className="space-y-4">
            {loading ? (
              <div className="h-24 bg-white rounded-xl shadow animate-pulse" />
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center">
                <div className="text-gray-600">No tickets yet</div>
                <Link to="/events" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Browse Events</Link>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b._id} className="bg-white rounded-2xl shadow p-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {b.event?.images?.[0] && (
                      <img src={b.event.images[0].url} alt="event" className="w-24 h-16 rounded-md object-cover" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{b.event?.title}</h3>
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                        <span className="inline-flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {new Date(b.event?.startDate).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {b.event?.venue?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => downloadTicket(b)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Download Ticket</button>
                    <Link to={`/events/${b.event?._id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg">View Event</Link>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === 'favorites' && (
          <section className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-gray-600">Favorites feature is not enabled yet.</div>
            <Link to="/events" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Explore Events</Link>
          </section>
        )}

        {activeTab === 'created' && (
          <section className="space-y-4">
            {loading ? (
              <div className="h-24 bg-white rounded-xl shadow animate-pulse" />
            ) : createdEvents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center">
                <div className="text-gray-600">No events created yet</div>
                <Link to="/create-event" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Create Your First Event</Link>
              </div>
            ) : (
              createdEvents.map((e) => (
                <div key={e._id} className="bg-white rounded-2xl shadow p-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{e.title}</h3>
                    <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                      <span className="inline-flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {new Date(e.startDate).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {e.venue?.name}</span>
                    </div>
                  </div>
                  <Link to={`/events/${e._id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg">View Details</Link>
                </div>
              ))
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;


