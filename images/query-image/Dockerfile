FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy script and configuration files
COPY cloud_query_script.py /app/
COPY config.json /app/

# Install dependencies
RUN pip install boto3 pycryptodome requests

# Set environment variables (to be overridden at runtime)
ENV AWS_REGION=us-east-1
ENV CONFIG_PATH=/app/config.json

# Command to run the script
CMD ["python", "cloud_query_script.py"]
