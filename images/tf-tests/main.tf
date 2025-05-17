# Terraform configuration for enriched AWS POC infrastructure
provider "aws" {
  region = "us-east-1"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# VPC A
resource "aws_vpc" "vpc_a" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "vpc-a"
  }
}

resource "aws_subnet" "vpc_a_subnet_1" {
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "vpc-a-subnet-1"
  }
}

resource "aws_subnet" "vpc_a_subnet_2" {
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "vpc-a-subnet-2"
  }
}

resource "aws_internet_gateway" "igw_a" {
  vpc_id = aws_vpc.vpc_a.id
  tags = {
    Name = "igw-a"
  }
}

resource "aws_route_table" "rt_a" {
  vpc_id = aws_vpc.vpc_a.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_a.id
  }
  tags = {
    Name = "rt-a"
  }
}

resource "aws_route_table_association" "rt_assoc_a1" {
  subnet_id      = aws_subnet.vpc_a_subnet_1.id
  route_table_id = aws_route_table.rt_a.id
}

resource "aws_route_table_association" "rt_assoc_a2" {
  subnet_id      = aws_subnet.vpc_a_subnet_2.id
  route_table_id = aws_route_table.rt_a.id
}

# VPC B (for peering)
resource "aws_vpc" "vpc_b" {
  cidr_block = "10.1.0.0/16"
  tags = {
    Name = "vpc-b"
  }
}

resource "aws_subnet" "vpc_b_subnet" {
  vpc_id            = aws_vpc.vpc_b.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "vpc-b-subnet"
  }
}

# VPC Peering
resource "aws_vpc_peering_connection" "peer" {
  vpc_id        = aws_vpc.vpc_a.id
  peer_vpc_id   = aws_vpc.vpc_b.id
  auto_accept   = true
  tags = {
    Name = "vpc-a-to-vpc-b"
  }
}

resource "aws_route" "peer_route_a" {
  route_table_id         = aws_route_table.rt_a.id
  destination_cidr_block = aws_vpc.vpc_b.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}

resource "aws_security_group" "sg" {
  name        = "poc-sg"
  description = "Allow SSH and HTTP access"
  vpc_id      = aws_vpc.vpc_a.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "poc-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "alb" {
  name               = "poc-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.sg.id]
  subnets            = [aws_subnet.vpc_a_subnet_1.id, aws_subnet.vpc_a_subnet_2.id]
  tags = {
    Name = "poc-alb"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "poc" {
  bucket = "neo4j-poc-bucket-${random_id.bucket_suffix.hex}"
  acl    = "private"
  tags = {
    Name = "poc-bucket"
  }
}

# Example EC2 for Neo4j
resource "aws_instance" "neo4j" {
  ami                    = "ami-080e1f13689e07408"
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.vpc_a_subnet_1.id
  vpc_security_group_ids = [aws_security_group.sg.id]  # ✅ Use the SG ID, not name


  tags = {
    Name = "neo4j-poc"
  }

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install java-openjdk11 -y
              yum install wget -y
              wget https://neo4j.com/artifact.php?name=neo4j-community-5.12.0-unix.tar.gz -O neo4j.tar.gz
              tar -xzf neo4j.tar.gz
              cd neo4j-community-5.12.0
              bin/neo4j start
              EOF
}
