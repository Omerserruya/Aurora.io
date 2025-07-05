# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Copy the script to the container
COPY validate.py .

# Install boto3
RUN pip install boto3


# Command to run the script
CMD ["python", "validate.py"]
