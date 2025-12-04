const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const BASE_URL = 'http://localhost:5000/api/v1';
const EMAIL = `test_refresh_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function runVerification() {
  try {
    console.log('1. Checking User (Initiating OTP)...');
    const checkRes = await client.post(`${BASE_URL}/users/check`, {
      email: EMAIL,
      password: PASSWORD // Sending password here as per controller logic, though for new user it triggers OTP
    });
    
    console.log('Check Response:', checkRes.data);
    
    if (!checkRes.data.data.otp) {
      // If user exists, we might get a different response. 
      // If so, we should try to sign in directly.
      if (checkRes.data.message.includes("User found")) {
         console.log('User exists, trying to sign in...');
         // Proceed to login logic if needed, but let's assume new user for this test
      }
      throw new Error('OTP not received in response. Is the user already registered?');
    }

    const { otp, otpId } = checkRes.data.data;
    console.log(`Received OTP: ${otp}, OTP ID: ${otpId}`);

    console.log('2. Verifying OTP and Registering...');
    const verifyRes = await client.post(`${BASE_URL}/users/verify-otp`, {
      otpId,
      otp,
      email: EMAIL,
      password: PASSWORD
    });
    
    console.log('Verify Response:', verifyRes.data);
    console.log('Cookies after registration:', jar.getCookiesSync(BASE_URL));

    console.log('3. Accessing Protected Route (Category)...');
    const categoryRes = await client.get(`${BASE_URL}/category`);
    console.log('Category Response Status:', categoryRes.status);
    // console.log('Category Data:', categoryRes.data);

    console.log('4. Refreshing Token...');
    // Wait a second just to be sure
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const refreshRes = await client.post(`${BASE_URL}/users/refresh-token`);
    console.log('Refresh Response:', refreshRes.data);
    console.log('Cookies after refresh:', jar.getCookiesSync(BASE_URL));

    console.log('5. Accessing Protected Route with New Token...');
    const categoryRes2 = await client.get(`${BASE_URL}/category`);
    console.log('Category Response 2 Status:', categoryRes2.status);

    console.log('VERIFICATION SUCCESSFUL');

  } catch (error) {
    console.error('VERIFICATION FAILED');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runVerification();
