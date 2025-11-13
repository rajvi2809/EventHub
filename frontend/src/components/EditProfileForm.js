import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditProfileForm = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await authAPI.updateProfile(form);
      if (res.data && res.data.user) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // update auth context user if available
  if (updateUser) updateUser(res.data.user);
      }
    } catch (err) {
      console.error('Update profile error', err);
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="firstName" value={form.firstName} onChange={handleChange} className="border p-2 rounded" placeholder="First name" />
        <input name="lastName" value={form.lastName} onChange={handleChange} className="border p-2 rounded" placeholder="Last name" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="phone" value={form.phone} onChange={handleChange} className="border p-2 rounded" placeholder="Phone" />
        <input name="location" value={form.location} onChange={handleChange} className="border p-2 rounded" placeholder="Location" />
      </div>
      {/* Avatar option removed per request */}
      <div>
        <textarea name="bio" value={form.bio} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Short bio" rows={4} />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
  );
};

export default EditProfileForm;
