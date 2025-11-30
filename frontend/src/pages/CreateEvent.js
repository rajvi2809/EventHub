import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import { eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateEvent = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Redirect if not authenticated or not an organizer
    if (!isAuthenticated || user?.role !== 'organizer') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const [form, setForm] = useState({
    imageFile: null,
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    price: '0',
    capacity: '',
    venueType: 'physical', // NEW FIELD
  });

  const { id: eventId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await eventsAPI.getCategories();
        setCategories(res.data.categories || []);
      } catch (e) {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // If eventId present, fetch event and prefill form for editing
  useEffect(() => {
    let mounted = true;
    const loadEvent = async () => {
      if (!eventId) return;
      try {
        const res = await eventsAPI.getEvent(eventId);
        const evt = res.data.event;
        if (!evt || !mounted) return;

        // parse ISO startDate into date and time inputs
        const startDate = evt.startDate ? new Date(evt.startDate) : null;
        const dateVal = startDate
          ? startDate.toISOString().slice(0, 10) // yyyy-mm-dd
          : '';
        const timeVal = startDate
          ? startDate.toTimeString().slice(0,5) // HH:MM
          : '';

        const ticket = (evt.ticketTypes && evt.ticketTypes[0]) || {};

        setForm({
          imageFile: null,
          title: evt.title || '',
          description: evt.description || '',
          category: evt.category || '',
          date: dateVal,
          time: timeVal,
          location: evt.venue?.name || evt.venue?.address?.city || '',
          price: ticket.price != null ? String(ticket.price) : '0',
          capacity: ticket.quantity != null ? String(ticket.quantity) : evt.capacity || '',
          venueType: evt.venue?.type || 'physical',
        });
        setIsEditMode(true);
      } catch (err) {
        // ignore — event not found or unauthorized
      }
    };
    loadEvent();
    return () => { mounted = false; };
  }, [eventId]);

  const canSubmit = useMemo(() => {
    return (
      !!form.title &&
      !!form.description &&
      !!form.category &&
      !!form.date &&
      !!form.time &&
      !!form.location &&
      !!form.capacity
    );
  }, [form]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imageFile') {
      setForm((prev) => ({ ...prev, imageFile: files?.[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toISODateRange = () => {
    try {
      // Handle date formats from different browsers/inputs.
      // HTML date input typically returns `yyyy-mm-dd`, but older code expected `dd-mm-yyyy`.
      const parts = (form.date || '').split('-');
      if (parts.length !== 3) return { startDate: null, endDate: null };

      let dd, mm, yyyy;
      // If first part looks like a year (length 4) assume yyyy-mm-dd
      if (parts[0].length === 4) {
        yyyy = parseInt(parts[0], 10);
        mm = parseInt(parts[1], 10);
        dd = parseInt(parts[2], 10);
      } else {
        // otherwise assume dd-mm-yyyy
        dd = parseInt(parts[0], 10);
        mm = parseInt(parts[1], 10);
        yyyy = parseInt(parts[2], 10);
      }

      if (!yyyy || !mm || !dd) return { startDate: null, endDate: null };
      const [hh, min] = (form.time || '').split(':').map((x) => parseInt(x, 10));
      const start = new Date(yyyy, (mm || 1) - 1, dd, hh || 0, min || 0);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h duration
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } catch {
      return { startDate: null, endDate: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated || user?.role !== 'organizer') {
      setError('You must be logged in as an organizer to create events.');
      return;
    }

    if (!canSubmit) {
      setError('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { startDate, endDate } = toISODateRange();

      // Client-side validation: ensure startDate parsed and is in the future
      if (!startDate) {
        setError('Start date is invalid. Please select a valid date.');
        setSubmitting(false);
        return;
      }

      if (new Date(startDate) <= new Date()) {
        setError('Start date must be in the future');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        startDate,
        endDate,
        venue: {
          type: form.venueType,
          name: form.location,
          address: {
            city: form.location,
          },
        },
        ticketTypes: [
          {
            name: 'General',
            description: 'General admission',
            price: Number(form.price || 0),
            quantity: Number(form.capacity || 0),
            saleStartDate: startDate,
            saleEndDate: endDate,
          },
        ],
      };
      
      // Optional image: convert to base64 and send as `images` array expected by the model
      if (form.imageFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(form.imageFile);
        });
        payload.images = [
          {
            url: base64,
            alt: form.title || '',
            isPrimary: true,
          },
        ];
      }

      if (isEditMode && eventId) {
        await eventsAPI.updateEvent(eventId, payload);
        setSuccess('Event updated successfully!');
        // Redirect to event details after update
        navigate(`/events/${eventId}`);
      } else {
        await eventsAPI.createEvent(payload);
        setSuccess('Event created successfully!');
      }
      // Reset minimal fields
      setForm((prev) => ({
        ...prev,
        imageFile: null,
        title: '',
        description: '',
        category: '',
        date: '',
        time: '',
        location: '',
        price: '0',
        capacity: '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Create Your Event</h1>
          <p className="mt-2 text-gray-600">Fill in the details below to create an amazing event</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <input name="imageFile" type="file" accept="image/*" onChange={handleChange} />
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                id="description"
                name="description"
                rows="5"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">Event Time *</label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter event location"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

        {/* Venue Type */}
        <div>
          <label htmlFor="venueType" className="block text-sm font-medium text-gray-700 mb-2">
            Venue Type *
          </label>
          <select
            id="venueType"
            name="venueType"
            value={form.venueType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="physical">Physical</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Select whether this event is online, in-person, or both</p>
        </div>

            {/* Price/Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Ticket Price (₹) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Enter 0 for free events</p>
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">Event Capacity *</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
              </button>
              <a
                href="/events"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEvent;