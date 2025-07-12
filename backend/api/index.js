const { createNestServer } = require('../dist/src/main.js');

let server = null;

module.exports = async (req, res) => {
  if (!server) {
    server = await createNestServer();
  }
  return server(req, res);
}; 