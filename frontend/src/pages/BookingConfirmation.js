import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { bookingsAPI } from '../services/api';

const BookingConfirmation = () => {
  const location = useLocation();
  const { booking, event } = location.state || {};
  const [fullBooking, setFullBooking] = useState(booking || null);

  useEffect(() => {
    // If we only have a minimal booking object, fetch full booking details from backend
    const loadBooking = async () => {
      try {
        if (booking?._id) {
          const res = await bookingsAPI.getBooking(booking._id);
          setFullBooking(res.data.booking || booking);
          // Clear cached event lists so counts (attendees) refresh across the app
          try { localStorage.removeItem('eventsList'); } catch (e) {}
        }
      } catch (err) {
        // ignore, use whatever we have
        console.warn('Failed to fetch full booking details', err);
      }
    };
    loadBooking();
  }, [booking]);

  if (!booking || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid booking confirmation</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-8">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Booking Confirmed!</h2>
            <p className="mt-2 text-lg text-gray-600">
              Thank you for booking. Your tickets have been sent to your email.
            </p>
          </div>

          <div className="border-t border-b border-gray-200 py-6 my-6">
            <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-600">Booking Number</dt>
                <dd className="mt-1 text-lg font-medium text-gray-900">{booking.bookingNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="mt-1">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {booking.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Event Information</h3>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-24 w-24 object-cover rounded-lg"
                />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                <p className="text-gray-600">{event.date}</p>
                <p className="text-gray-600">{event.venue}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                // open printable ticket in new window and trigger print
                const b = fullBooking || booking;
                const attendees = b?.attendees || [];
                const eventImage = b?.event?.images?.[0]?.url || event.image || '';
                const organizerName = b?.event?.organizer ? `${b.event.organizer.firstName || ''} ${b.event.organizer.lastName || ''}` : '';
                const html = `
                  <html>
                    <head>
                      <title>Ticket - ${b?.event?.title || event.title}</title>
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
                            <h1>Ticket - ${b?.event?.title || event.title}</h1>
                            <div class="meta">Booking #: <strong>${b?.bookingNumber || ''}</strong></div>
                            <div class="meta">Status: <strong>${b?.status || ''}</strong></div>
                          </div>
                          ${eventImage ? `<img src="${eventImage}" class="event-img" alt="Event image" />` : ''}
                        </div>
                        <div class="section header-row">
                          <div>
                            <div class="meta">Event: <strong>${b?.event?.title || event.title}</strong></div>
                            <div class="meta">When: <strong>${b?.event?.startDate ? new Date(b.event.startDate).toLocaleString() : event.date}</strong></div>
                            <div class="meta">Where: <strong>${b?.event?.venue?.name || event.venue}</strong></div>
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
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(html);
                  win.document.close();
                } else {
                  alert('Please allow popups to download/print the ticket');
                }
              }}
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Download Ticket
            </button>

            <Link
              to="/profile"
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View My Bookings
            </Link>

            <Link
              to="/"
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;