// Import the compiled NestJS app
const createNestServer = require('../dist/src/main.js').default;

let server = null;

module.exports = async (req, res) => {
  try {
    if (!server) {
      console.log('🚀 Initializing NestJS server for Vercel...');
      server = await createNestServer();
      console.log('✅ NestJS server initialized successfully');
    }
    return server(req, res);
  } catch (error) {
    console.error('❌ Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}; 