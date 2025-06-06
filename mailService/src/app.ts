import initApp from "./server";

const port = process.env.PORT || 4007;

initApp().then((app) => {
  app.listen(port, () => {
    console.log(`Mail service running on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down mail service...');
  process.exit(0);
}); 