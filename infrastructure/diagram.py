from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import EC2, AutoScaling
from diagrams.aws.database import ElastiCache, RDS
from diagrams.aws.network import ELB, Route53, CloudFront
from diagrams.aws.storage import S3
from diagrams.aws.general import Users

# Setting Graphviz attributes for a cleaner look
graph_attr = {"fontsize": "20", "bgcolor": "white"}

with Diagram(
    "Domrov LMS - Cloud Computing Architecture",
    show=False,
    direction="LR",
    filename="domrov_architecture",
    graph_attr=graph_attr,
):

    user = Users("Students/Instructors")
    dns = Route53("Route 53")

    with Cluster("AWS Cloud (Region: us-east-1)"):

        # --- FRONTEND TIER (Public) ---
        with Cluster("Frontend Static Hosting"):
            cf = CloudFront("CloudFront CDN")
            s3_frontend = S3("S3 - Frontend Assets")

        # --- NETWORK TIER (Public Subnets) ---
        with Cluster("Public Subnet"):
            alb = ELB("Application Load Balancer")

        # --- APPLICATION TIER (Private Subnets) ---
        with Cluster("Private Subnet - Logic"):

            with Cluster("API Cluster (NestJS)"):
                # Representing High Availability with multiple nodes
                nestjs_nodes = [EC2("API Node 1"), EC2("API Node 2")]
                nestjs_asg = AutoScaling("ASG (NestJS)")

            with Cluster("Compute Cluster (Python)"):
                # Separate scaling for heavy AI/Code Eval tasks
                python_nodes = [EC2("Worker 1"), EC2("Worker 2")]
                python_asg = AutoScaling("ASG (Python)")

        # --- DATA TIER (Private Subnets) ---
        with Cluster("Private Subnet - Storage"):
            db_primary = RDS("RDS PostgreSQL\n(Multi-AZ)")
            redis = ElastiCache("Redis Cloud/ElastiCache")
            s3_data = S3("S3 - User Files")

    # --- DEFINING THE FLOW ---

    # 1. Frontend Path
    user >> dns >> cf >> s3_frontend

    # 2. API Path (User -> ALB -> NestJS)
    dns >> alb >> nestjs_nodes

    # 3. Service-to-Service (NestJS -> Python)
    # Fixing the list-to-list error by looping
    for api in nestjs_nodes:
        api >> Edge(label="gRPC (Internal)", color="darkgreen") >> python_nodes

    # 4. Data Persistence
    # Connecting lists to single nodes is natively supported
    nestjs_nodes >> db_primary
    nestjs_nodes >> s3_data

    python_nodes >> redis
    python_nodes >> s3_data

print("Success! Diagram generated as 'domrov_architecture.png'")
