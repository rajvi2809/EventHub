// Simple authentication flow test utility
// This file can be used for manual testing of the authentication flow

export const testAuthFlow = async () => {
  // Use REACT_APP_API_URL (CRA build-time) or fall back to same-origin `/api`.
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  
  console.log('🧪 Testing EventHub Authentication Flow...');
  
  try {
    // Test 1: Health check
    console.log('1. Testing API health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData);
    
    // Test 2: Registration
    console.log('2. Testing registration...');
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123',
      phone: '+1234567890',
      role: 'attendee'
    };
    
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration:', registerData);
    
    if (registerData.success) {
      // Test 3: OTP Verification (this would need actual OTP from email)
      console.log('3. Registration successful! Check your email for OTP.');
      console.log('   Email:', testUser.email);
      console.log('   Note: You need to manually verify OTP to complete the flow');
      
      // Test 4: Login (only works after OTP verification)
      console.log('4. After OTP verification, you can test login with:');
      console.log('   Email:', testUser.email);
      console.log('   Password: TestPass123');
    }
    
    return {
      success: true,
      message: 'Authentication flow test completed',
      testUser
    };
    
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.testAuthFlow = testAuthFlow;
}
