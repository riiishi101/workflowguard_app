// Usage: node scripts/generate-jwt.js [userId] [email] [role]
const jwt = require('jsonwebtoken');

const userId = process.argv[2] || 'test-user-id';
const email = process.argv[3] || 'user@example.com';
const role = process.argv[4] || 'admin';
const secret = process.env.JWT_SECRET || 'supersecretkey';

const token = jwt.sign(
  { sub: userId, email, role },
  secret,
  { expiresIn: '7d' }
);

console.log('Generated JWT:');
console.log(token); 