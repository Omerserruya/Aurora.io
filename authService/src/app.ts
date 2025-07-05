import initApp from "./server";
import fs from 'fs';

// Add necessary environment variables for inter-service communication
process.env.USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://users-service:4001';

const port = process.env.PORT || 4002;

// No need to import or connect to the database directly, as we're using the Users service API
// You only need to keep this if you have other models specific to the Auth service

// Go back to passing app to initApp if that's what server.ts expects
initApp().then((app) => {  // Catch the app returned from initApp
  // We don't need to serve static files from Express since Nginx will handle it directly
  // But we'll keep the directory creation logic
  const usersUploadsDir = process.env.PROFILE_UPLOAD_PATH;
  if(!usersUploadsDir) {
    throw new Error('PROFILE_UPLOAD_PATH is not defined in the environment variables');
  }
  if (!fs.existsSync(usersUploadsDir)) {
    fs.mkdirSync(usersUploadsDir, { recursive: true });
  }
  
  app.listen(port, () => {
    console.log(`Auth Service is running on port ${port}`);
    console.log(`Configured to connect to User Service at: ${process.env.USER_SERVICE_URL}`);
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});