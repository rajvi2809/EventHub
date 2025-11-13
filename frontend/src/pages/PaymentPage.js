import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
  });

  const { eventDetails, selectedTickets } = location.state || {};

  const calculateTotalAmount = () => {
    const ticketPrice = eventDetails?.ticketPrice || 0;
    const quantity = selectedTickets || 1;
    const subtotal = ticketPrice * quantity;
    const serviceFee = Math.round(subtotal * 0.10); // 10% service fee
    return {
      subtotal,
      serviceFee,
      total: subtotal + serviceFee
    };
  };

  const { subtotal, serviceFee, total } = calculateTotalAmount();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order (call backend route without duplicating /api)
      const orderResponse = await api.post('/payments/create-order', {
        amount: total,
        eventId: eventDetails._id,
        items: [{
          ticketTypeId: eventDetails.ticketTypeId,
          quantity: selectedTickets
        }],
        attendees: [{
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email
        }],
        billingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          phone: formData.phone
        },
        paymentMethod: 'razorpay'
      });

      const { key_id, order } = orderResponse.data;

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "EventHub",
        description: `Booking for ${eventDetails.title}`,
        order_id: order.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          address: formData.address
        },
        theme: {
          color: "#3B82F6"
        },
        handler: async function (response) {
          try {
            const verifyResponse = await api.post('/payments/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              navigate('/booking-confirmation', {
                state: {
                  booking: verifyResponse.data.booking,
                  event: eventDetails
                }
              });
            }
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      // Log full error for debugging
      console.error('Create order error (frontend):', error);

      // Prefer server-provided message, then common fields
      const serverMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      setError(serverMessage || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!eventDetails || !selectedTickets) {
    return <div className="text-center py-10">Invalid payment request</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left side - Form */}
        <div className="md:w-2/3">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            <form onSubmit={handlePayment}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </form>
          </div>
        </div>

        {/* Right side - Order Summary */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="mb-4">
              <img
                src={eventDetails.image}
                alt={eventDetails.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="font-medium">{eventDetails.title}</h3>
              <p className="text-gray-600">{eventDetails.date}</p>
              <p className="text-gray-600">{eventDetails.venue}</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Tickets ({selectedTickets}x)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Service Fee</span>
                <span>₹{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="flex items-center">
                <span className="mr-2">🔒</span>
                Secure checkout powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;