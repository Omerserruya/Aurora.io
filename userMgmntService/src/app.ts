import initApp from "./server";
import fs from 'fs';

const port = process.env.PORT || 4001;

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
    console.log(`User Management Service is running on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});