const http = require('http');

const data = JSON.stringify({
  "restaurant_name": "Tasty Bites",
  "restaurant_email": "info@tastybites.com",
  "restaurant_phone": "1234567890",
  "restaurant_type": "Dine-in",
  "restaurant_logo": "http://example.com/logo.png",
  "branch_name": "Downtown Branch",
  "branch_phone": "0987654321",
  "country": "India",
  "state": "Kerala",
  "district": "Ernakulam",
  "city": "Kochi",
  "place": "MG Road",
  "currency": "INR",
  "symbol": "₹",
  "symbol_position": "left",
  "facebook_url": "fb.com/tastybites",
  "instagram_url": "insta.com/tastybites",
  "google_feedback_url": "g.page/tastybites"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/restaurant/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', responseBody);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
