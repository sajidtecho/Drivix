const payload = {
  name: 'Vercel Live Tester',
  email: `live_tester_${Date.now()}@drivix.com`,
  mobile: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Password123!',
  city: 'Greater Noida'
};

console.log('Registering user on live backend:', payload.email);

try {
  const res = await fetch('https://drivix-backend-0qvx.onrender.com/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
} catch (err) {
  console.error('Error:', err.message);
}
