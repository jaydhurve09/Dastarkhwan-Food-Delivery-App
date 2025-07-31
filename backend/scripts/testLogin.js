import axios from 'axios';

async function testLogin() {
  try {
    const loginData = {
      email: 'superadmin@dastarkhwan.com',
      password: 'Test@1234'
    };

    console.log('Attempting to log in...');
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    console.log('Login successful!');
    console.log('Response data:', response.data);
    
    if (response.data.token) {
      console.log('JWT Token:', response.data.token);
      
      // Test accessing a protected route
      console.log('\nTesting protected route...');
      const protectedResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('Protected route response:', protectedResponse.data);
    }
    
  } catch (error) {
    console.error('Login test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
}

testLogin();
