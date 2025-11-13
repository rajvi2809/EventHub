import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Reviews from '../components/Reviews';
import { eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ShareIcon,
  HeartIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const EventDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchEvent = async () => {
      try {
        const response = await eventsAPI.getEvent(id, {
          signal: controller.signal
        });
        setEvent(response.data.event);
        if (response.data.event.ticketTypes?.length > 0) {
          setSelectedTicketType(response.data.event.ticketTypes[0]._id);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();

    return () => {
      controller.abort(); // Cancel request if component unmounts
    };
  }, [id]);

  const handleBooking = () => {
    if (!isAuthenticated) {
      alert('Please login to book tickets');
      return;
    }

    // Prevent organizers from booking tickets — they should use an attendee account
    if (user?.role === 'organizer') {
      alert('You are currently logged in as an organizer. Please login with an attendee account to book tickets.');
      return;
    }

    if (!selectedTicketType) {
      alert('Please select a ticket type');
      return;
    }

    const selectedTicketTypeObj = event.ticketTypes.find(t => t._id === selectedTicketType);
    
    // Navigate to payment page with event and ticket details
    navigate('/payment', {
      state: {
        eventDetails: {
          _id: event._id,
          title: event.title,
          image: event.images?.[0]?.url,
          date: formatDate(event.startDate),
          venue: `${event.venue?.name}, ${event.venue?.address?.city}`,
          ticketTypeId: selectedTicketType,
          ticketPrice: selectedTicketTypeObj.price
        },
        selectedTickets: ticketQuantity
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/events" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Event Image */}
            <div className="relative h-64 md:h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-6 overflow-hidden">
              {event.images && event.images[0] && (
                <img
                  src={event.images[0].url}
                  alt={event.images[0].alt || event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                  }}
                />
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {event.category}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors">
                  <ShareIcon className="h-5 w-5 text-white" />
                </button>
                <button className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors">
                  <HeartIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Event Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">{formatDate(event.startDate)}</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">{formatTime(event.startDate)} - {formatTime(event.endDate)}</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">{event.venue?.name}</div>
                  <div className="text-sm">{event.venue?.address?.city}, {event.venue?.address?.state}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>

            {/* Additional Info */}
            {event.additionalInfo && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Additional Information</h2>
                <p className="text-gray-600 leading-relaxed">{event.additionalInfo}</p>
              </div>
            )}

            {/* Refund Policy */}
            {event.refundPolicy && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Policy</h2>
                <p className="text-gray-600 leading-relaxed">{event.refundPolicy}</p>
              </div>
            )}

            {/* Organizer */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Organized By</h2>
              {event.organizer?._id ? (
                <Link 
                  to={`/profile/${event.organizer._id}`}
                  className="flex items-center group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {event.organizer.firstName} {event.organizer.lastName}
                    </div>
                    <div className="text-sm text-gray-600">Event Organizer</div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center p-2">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Anonymous Organizer
                    </div>
                    <div className="text-sm text-gray-600">Event Organizer</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Tickets</h2>
              
              {/* Ticket Types */}
              <div className="space-y-4 mb-6">
                {event.ticketTypes?.map((ticketType) => (
                  <div key={ticketType._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{ticketType.name}</h3>
                        <p className="text-sm text-gray-600">{ticketType.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{ticketType.price}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticketType.quantity - ticketType.sold} left
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="ticketType"
                      value={ticketType._id}
                      checked={selectedTicketType === ticketType._id}
                      onChange={(e) => setSelectedTicketType(e.target.value)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-600">Select this ticket</label>
                  </div>
                ))}
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 border border-gray-300 rounded-l-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      -
                    </button>
                    <div className="px-4 py-2 border-t border-b border-gray-300 min-w-[60px] text-center">
                      {ticketQuantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const selectedType = event.ticketTypes?.find(t => t._id === selectedTicketType);
                        const maxAvailable = selectedType ? selectedType.quantity - selectedType.sold : 5;
                        setTicketQuantity(prev => Math.min(maxAvailable, prev + 1));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedTicketType && (
                      `${event.ticketTypes.find(t => t._id === selectedTicketType)?.quantity - 
                        event.ticketTypes.find(t => t._id === selectedTicketType)?.sold} tickets available`
                    )}
                  </p>
              </div>

              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{selectedTicketType ? 
                      (event.ticketTypes?.find(t => t._id === selectedTicketType)?.price || 0) * ticketQuantity 
                      : 0}
                  </span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={!selectedTicketType}
                className="w-full bg-blue-600 hover:bg-blue-700 hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {'Book Now'}
              </button>

              {/* Event Stats */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center text-sm text-gray-500">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {event.totalTicketsSold || 0} attending
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section - Only show for completed events */}
        {event.status === 'completed' && (
          <div className="mt-8">
            <Reviews eventId={event._id} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventDetails;
