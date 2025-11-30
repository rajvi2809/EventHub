import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Registration, 2: OTP Verification
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'attendee',
  });
  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverErrorDetails, setServerErrorDetails] = useState(null);
  const [success, setSuccess] = useState('');

  const { register, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    setOtpData({
      ...otpData,
      [name]: name === 'otp' ? value.replace(/\D/g, '') : value,
    });
  };

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber
    };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation

    const nameRegex = /^[A-Za-z]+$/; 
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    if (!nameRegex.test(formData.firstName)) {
      setError('First name should contain letters only');
      setLoading(false);
      return;
    }

    // Last name validation
    if (!nameRegex.test(formData.lastName)) {
      setError('Last name should contain letters only');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('Password must be at least 6 characters with uppercase, lowercase, and number');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        firstName: (formData.firstName || '').trim(),
        lastName: (formData.lastName || '').trim(),
        email: (formData.email || '').trim().toLowerCase(),
        password: formData.password,
        phone: (formData.phone || '').trim(),
        role: formData.role,
      };

      // Debug: log payload before sending
      console.log('Register payload:', payload);

      const result = await register(payload);

      if (result.success) {
        // Capture both email and userId in case backend expects userId for OTP verification
        const returnedUser = result.data?.user || result.data?.data?.user || result.data?.userData;
        const returnedUserId = returnedUser?._id || result.data?.userId || result.data?.id;
        console.log('Registration successful. Preparing OTP payload with email and possible userId:', formData.email, returnedUserId);
        setOtpData({ email: formData.email, userId: returnedUserId || '', otp: '' });
        setStep(2);
        setSuccess('Registration successful! Please check your email for the OTP.');
      } else {
        console.error('Registration failed response:', result);
        setError(result.message || 'Registration failed');
        // Capture detailed server error payload if present (including normalized/raw errors)
        setServerErrorDetails(result.error || result.raw || null);
      }
    } catch (err) {
      console.error('Registration error thrown:', err);
      const serverData = err?.response?.data || null;
      setError(serverData?.message || 'Registration failed. Please try again.');
      setServerErrorDetails(serverData || err || null);
    }
    
    setLoading(false);
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!otpData.otp) {
      setError('Please enter the OTP');
      setLoading(false);
      return;
    }

    if (!otpData.email) {
      setError('Email not found. Please try registering again.');
      setLoading(false);
      return;
    }

    // Debug: Log the data being sent
    console.log('OTP Verification Data:', otpData);

    const payload = {
      email: (otpData.email || '').trim().toLowerCase(),
      userId: (otpData.userId || '').trim(),
      otp: (otpData.otp || '').trim(),
    };

    const result = await verifyOTP(payload);

    if (result.success) {
      setSuccess('Email verified successfully! You can now login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    const result = await resendOTP((otpData.email || '').trim().toLowerCase());

    if (result.success) {
      setSuccess('OTP resent successfully!');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-900 flex flex-col dark:text-gray-100">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        {/* Logo and Welcome Section */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/EventHub_Logo.png" 
              alt="EventHub Logo" 
              className="h-16 w-16 object-contain mr-2"
            />
            <h1 className="text-3xl font-bold">
              <span className="text-blue-600">Event</span>
              <span className="text-purple-600">Hub</span>
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join EventHub to discover amazing events</p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex mb-6">
            <Link 
              to="/login" 
              className="flex-1 text-center py-2 px-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Login
            </Link>
            <div className="flex-1 text-center py-2 px-4 bg-blue-50 rounded-lg shadow-sm">
              <span className="text-gray-800 font-medium">Sign Up</span>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-6" autoComplete="off">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {serverErrorDetails && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2 break-words">
                  <strong>Details:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">{JSON.stringify(serverErrorDetails, null, 2)}</pre>
                </div>
              )}

              {/* Full Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="attendee">Attendee</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  
                  value={formData.password}
                  onChange={handleChange}
                />
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{passwordValidation.minLength ? '✓' : '✗'}</span>
                      At least 6 characters
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{passwordValidation.hasUpperCase ? '✓' : '✗'}</span>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{passwordValidation.hasLowerCase ? '✓' : '✗'}</span>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                      One number
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              {/* Terms and Privacy Policy */}
              {/* Terms and Privacy links removed to reduce friction on registration */}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            /* OTP Verification Step */
            <div className="space-y-6">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Email</h3>
                <p className="text-gray-600 text-sm mb-4">
                  We've sent a 6-digit verification code to <strong>{otpData.email}</strong>
                </p>
              </div>

              <form onSubmit={handleOtpVerification} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength="6"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg tracking-widest"
                    
                    value={otpData.otp}
                    onChange={handleOtpChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-500 hover:scale-105 text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                >
                  Resend OTP
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-700 text-sm transition-colors"
                >
                  ← Back to registration
                </button>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
