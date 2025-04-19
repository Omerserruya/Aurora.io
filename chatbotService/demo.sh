#!/bin/bash

echo "🚀 Starting AWS Chatbot Demo with MCP Architecture..."

# Check if .env.development file exists
if [ ! -f ".env.development" ]; then
  echo "❌ Error: .env.development file not found!"
  echo "Please create a .env.development file with the required environment variables."
  exit 1
fi

# Check if MCP service is running
if ! curl -s http://localhost:4006/api/mcp/health > /dev/null; then
  echo "⚠️  MCP service is not running! Starting it..."
  cd ..
  docker compose up mcp-service -d

  # Wait for MCP service to be healthy
  echo "⏳ Waiting for MCP service to be healthy..."
  for i in {1..30}; do
    if curl -s http://localhost:4006/api/mcp/health > /dev/null; then
      echo "✅ MCP service is now running!"
      break
    fi
    sleep 1
    echo -n "."
    if [ $i -eq 30 ]; then
      echo "❌ MCP service could not be started. Please check the logs."
      exit 1
    fi
  done
else
  echo "✅ MCP service is already running."
fi

# Check if DB service is running
if ! curl -s http://localhost:4003/health > /dev/null; then
  echo "⚠️  DB service is not running! Starting it..."
  cd ..
  docker compose up db-service -d
  
  echo "⏳ Waiting for DB service to be healthy..."
  for i in {1..30}; do
    if curl -s http://localhost:4003/health > /dev/null; then
      echo "✅ DB service is now running!"
      break
    fi
    sleep 1
    echo -n "."
    if [ $i -eq 30 ]; then
      echo "❌ DB service could not be started. Please check the logs."
      exit 1
    fi
  done
else
  echo "✅ DB service is already running."
fi

# Set environment variables if needed
export CHATBOT_SERVICE_URL=http://localhost:4005
export DB_SERVICE_URL=http://localhost:4003

# Compile TypeScript
echo "🔧 Compiling TypeScript..."
npm run build

# Clear the terminal
clear

# Run the demo test
echo "🧪 Running Demo with MCP Architecture..."
echo "This demo uses the Model Control Plane (MCP) service to abstract AI model interactions."
node dist/test.js

echo "✅ Demo completed! Check the output above for results." 