import React from 'react';
import { Link } from 'react-router-dom';
import Logout from '../components/Logout';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your platform's events and users</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              View Site
            </Link>
            <Logout />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            to="/admin/events" 
            className="group bg-white shadow-sm hover:shadow-lg rounded-xl p-6 transition-all duration-200 transform hover:-translate-y-1 animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-400 group-hover:text-blue-600 transition-colors">&rarr;</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Manage Events</h2>
            <p className="text-gray-600">Review and manage event statuses, bookings, and analytics</p>
          </Link>

          <Link 
            to="/admin/users" 
            className="group bg-white shadow-sm hover:shadow-lg rounded-xl p-6 transition-all duration-200 transform hover:-translate-y-1 animate-fadeIn delay-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-gray-400 group-hover:text-purple-600 transition-colors">&rarr;</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Manage Users</h2>
            <p className="text-gray-600">Oversee user roles, permissions, and account statuses</p>
          </Link>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 shadow-sm rounded-xl p-6 text-white animate-fadeIn delay-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Events</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Users</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Recent Bookings</span>
                  <span className="font-medium">--</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
