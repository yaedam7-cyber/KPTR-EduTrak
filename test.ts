import http from 'http';

const data = JSON.stringify({
  currentPassword: 'admin',
  newPassword: 'admin'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
