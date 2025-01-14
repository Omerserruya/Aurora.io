# Neo4j and AWS Resources Visualization

This project connects to your AWS account, retrieves EC2 instances, VPCs, and subnets, and visualizes their relationships in a Neo4j database.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Running the Application](#running-the-application)
4. [Why Use This Project](#why-use-this-project)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Docker](https://www.docker.com/products/docker-desktop)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- Python 3.x and `pip`
- Your AWS account with SSO access configured

---

## Setup Instructions

### 1. Configure Docker for Neo4j

1. Create a `docker-compose.yml` file in your project directory with the following content:

   ```yaml
   version: '3'
   services:
     neo4j:
       image: neo4j:latest
       container_name: neo4j
       environment:
         - NEO4J_AUTH=neo4j/your_password
       ports:
         - "7687:7687"  # Bolt protocol
         - "7474:7474"  # HTTP
       volumes:
         - neo4j_data:/data
       networks:
         - neo4j_network

   volumes:
     neo4j_data:

   networks:
     neo4j_network:
       driver: bridge```
   2. Start the Neo4j container:

```bash
docker-compose up -d
```

   3. Access Neo4j at [http://localhost:7474](http://localhost:7474) and log in with `neo4j/your_password`.
------
### 2. Install AWS CLI and Connect with SSO

1. Install AWS CLI if it's not already installed.

2. Configure AWS CLI with SSO:

   ```bash
   aws configure sso
   ```
   Follow the prompts to log in to your AWS account and configure your profile.

------
### 3. Install Python Dependencies

1. Install the required Python packages:

   ```bash
   pip install boto3 neo4j
   ```
------
## Running the Application

1. Update `app.py` with your details:
   - Replace `NEO4J_PASSWORD` with the password you set for Neo4j.
   - Replace `AWS_PROFILE` with your configured AWS SSO profile name.

2. Run the script:

   ```bash
   python app.py
   ```
The application will:

Connect to your AWS account.
Retrieve EC2 instances, VPCs, and subnets.
Create nodes and relationships in the Neo4j database.












