const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const { AppModule } = require('../dist/src/app.module.js');

let app = null;
let server = null;

async function bootstrap() {
  if (!app) {
    server = express();
    app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    
    // Set global prefix
    app.setGlobalPrefix('api');
    
    // Initialize the app
    await app.init();
    
    console.log('🚀 WorkflowGuard API initialized for Vercel');
  }
  return server;
}

module.exports = async (req, res) => {
  const expressServer = await bootstrap();
  return expressServer(req, res);
}; 