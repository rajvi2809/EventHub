import React from 'react';
import Footer from '../components/Footer';
import EditProfileForm from '../components/EditProfileForm';

const EditProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
          <p className="text-gray-600 mb-6">Update your personal information (name, phone, location, bio).</p>
          <EditProfileForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProfile;
