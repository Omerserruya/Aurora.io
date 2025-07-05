#!/bin/sh

echo "Building the test script..."
npx tsc src/test.ts --outDir dist --esModuleInterop true

echo "Running the Gemini API test..."
node dist/test.js 