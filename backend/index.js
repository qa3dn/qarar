// Railway entry point
console.log('🚀 Starting Qarar Backend...');
console.log('📁 Current directory:', process.cwd());
console.log('📄 Files in directory:', require('fs').readdirSync('.'));

// Start the server
require('./server.js');
