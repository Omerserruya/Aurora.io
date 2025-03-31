FROM alpine:latest

# Install required packages
RUN apk add --no-cache bash

# Create a simple shell script to print environment variables
RUN echo '#!/bin/bash' > /print-env.sh && \
    echo 'echo "=== Environment Variables ==="' >> /print-env.sh && \
    echo 'env | sort' >> /print-env.sh && \
    echo 'echo "=== End of Environment Variables ==="' >> /print-env.sh && \
    echo 'echo "Container will exit in 5 seconds..."' >> /print-env.sh && \
    echo 'sleep 5' >> /print-env.sh && \
    echo 'exit 0' >> /print-env.sh && \
    chmod +x /print-env.sh

# Set the entrypoint
ENTRYPOINT ["/bin/bash", "/print-env.sh"] 