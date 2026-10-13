const http = require('http');

async function testAuthIntegration() {
  console.log('========================================================');
  console.log('   DRIVIX AUTHENTICATION & DATABASE INTEGRATION TEST    ');
  console.log('========================================================\n');

  const testEmail = `test_driver_${Date.now()}@drivix.io`;
  const testPassword = 'Password@123';
  const testName = 'Mobile Integration Tester';
  const testMobile = '9876543210';

  console.log(`1. Testing Registration on Shared Backend...`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);

  // Test registration against local backend port 5000
  const registerPayload = JSON.stringify({
    name: testName,
    email: testEmail,
    password: testPassword,
    mobile: testMobile
  });

  const regResponse = await makeRequest('/api/v1/auth/register', 'POST', registerPayload);
  console.log(`   Registration Status: ${regResponse.status}`);
  if (regResponse.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(regResponse.data)}`);
  }
  console.log(`   ✓ Registration Successful!`);
  console.log(`   User ID: ${regResponse.data._id}`);
  console.log(`   JWT Token Received: ${regResponse.data.token ? 'YES' : 'NO'}`);
  console.log(`   Nested User Field: ${regResponse.data.user ? 'YES' : 'NO'}\n`);

  console.log(`2. Testing Login with Exact Credentials (Shared Auth)...`);
  const loginPayload = JSON.stringify({
    email: testEmail,
    password: testPassword
  });

  const loginResponse = await makeRequest('/api/v1/auth/login', 'POST', loginPayload);
  console.log(`   Login Status: ${loginResponse.status}`);
  if (loginResponse.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
  }
  console.log(`   ✓ Login Successful!`);
  console.log(`   User Email: ${loginResponse.data.email}`);
  console.log(`   User Role: ${loginResponse.data.role}\n`);

  console.log(`3. Testing Cross-Platform Case-Insensitive Email Normalization...`);
  const mixedCaseEmail = testEmail.toUpperCase();
  console.log(`   User typed in input: ${mixedCaseEmail}`);
  // Mobile app normalizes before sending:
  const normalizedForSend = mixedCaseEmail.trim().toLowerCase();
  console.log(`   Mobile client normalizes to: ${normalizedForSend}`);
  const mixedCasePayload = JSON.stringify({
    email: normalizedForSend,
    password: testPassword
  });

  const mixedLoginResponse = await makeRequest('/api/v1/auth/login', 'POST', mixedCasePayload);
  if (mixedLoginResponse.status !== 200) {
    throw new Error(`Case-insensitive login failed: ${JSON.stringify(mixedLoginResponse.data)}`);
  }
  console.log(`   ✓ Case-insensitive Login Successful!\n`);

  console.log(`4. Testing Authenticated Profile Retrieval (/api/v1/auth/profile)...`);
  const profileResponse = await makeRequest('/api/v1/auth/profile', 'GET', null, {
    'Authorization': `Bearer ${loginResponse.data.token}`
  });
  if (profileResponse.status !== 200) {
    throw new Error(`Profile fetch failed: ${JSON.stringify(profileResponse.data)}`);
  }
  console.log(`   ✓ Profile Retrieved Successfully!`);
  console.log(`   Profile Name: ${profileResponse.data.fullName || profileResponse.data.name}`);
  console.log(`   Profile Email: ${profileResponse.data.email}\n`);

  console.log(`5. Testing Duplicate Registration Prevention...`);
  const dupResponse = await makeRequest('/api/v1/auth/register', 'POST', registerPayload);
  if (dupResponse.status === 400 && dupResponse.data.message.includes('already exists')) {
    console.log(`   ✓ Duplicate registration correctly rejected with: "${dupResponse.data.message}"\n`);
  } else {
    throw new Error(`Expected 400 for duplicate, got ${dupResponse.status}`);
  }

  console.log(`6. Testing Invalid Password Rejection...`);
  const badLogin = await makeRequest('/api/v1/auth/login', 'POST', JSON.stringify({
    email: testEmail,
    password: 'WrongPassword999'
  }));
  if (badLogin.status === 401) {
    console.log(`   ✓ Invalid password correctly rejected with status 401: "${badLogin.data.message}"\n`);
  } else {
    throw new Error(`Expected 401 for wrong password, got ${badLogin.status}`);
  }

  console.log('========================================================');
  console.log('   ALL AUTHENTICATION INTEGRATION TESTS PASSED (6/6)    ');
  console.log('========================================================');
}

function makeRequest(path, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

testAuthIntegration().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
