#!/bin/bash

echo "🚀 Starting AWS Chatbot Demo with MCP Architecture..."

# Check if .env.development file exists
if [ ! -f ".env.development" ]; then
  echo "❌ Error: .env.development file not found!"
  echo "Please create a .env.development file with the required environment variables."
  exit 1
fi

# Set correct environment variables for local development
export CHATBOT_SERVICE_URL=http://localhost:4005
export DB_SERVICE_URL=http://localhost:4003
export MCP_SERVICE_URL=http://localhost:4006

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

# Compile TypeScript
echo "🔧 Compiling TypeScript..."
npm run build

echo "✅ Starting Chatbot service locally..."
# Start the chatbot service in background
npm run dev &
CHATBOT_PID=$!

# Wait for the Chatbot service to start
echo "⏳ Waiting for Chatbot service to be ready..."
for i in {1..10}; do
  if curl -s http://localhost:4005/api/chatbot/health > /dev/null; then
    echo "✅ Chatbot service is now running!"
    break
  fi
  sleep 1
  echo -n "."
  if [ $i -eq 10 ]; then
    echo "⚠️  Chatbot service not responding yet, but continuing..."
  fi
done

sleep 2
clear

# Run the demo test
echo "🧪 Running Demo with MCP Architecture..."
echo "This demo uses the Model Control Plane (MCP) service to abstract AI model interactions."

# Run the test directly from the current directory
node dist/test.js

# Kill the chatbot service process
kill $CHATBOT_PID 2>/dev/null

echo "✅ Demo completed! Check the output above for results." 