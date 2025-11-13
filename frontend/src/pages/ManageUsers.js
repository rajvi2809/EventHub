import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Logout from '../components/Logout';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      console.log('Users API response:', res.data); // Debug log
      if (res.data && (res.data.users || Array.isArray(res.data))) {
        setUsers(res.data.users || res.data);
      } else {
        console.error('Unexpected API response format:', res.data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      alert(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePromote = async (id) => {
    try {
      await usersAPI.updateUser(id, { role: 'admin' });
      alert('User promoted to admin');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await usersAPI.updateUser(id, { isActive: false });
      alert('User deactivated');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(id);
        alert('User deleted');
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')} 
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
            <Logout />
          </div>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <div>Total Users: {users.length}</div>
              <div>Admins: {users.filter(u => u.role === 'admin').length}</div>
              <div>Organizers: {users.filter(u => u.role === 'organizer').length}</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found in the system.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors animate-fadeIn">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'organizer' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => handlePromote(user._id)} 
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Promote
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeactivate(user._id)} 
                    className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button 
                    onClick={() => handleDelete(user._id)} 
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
