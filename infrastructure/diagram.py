from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import EC2, AutoScaling
from diagrams.aws.database import ElastiCache, RDS
from diagrams.aws.network import ELB, Route53, CloudFront
from diagrams.aws.storage import S3
from diagrams.aws.general import Users

graph_attr = {"fontsize": "20", "bgcolor": "white"}

with Diagram(
    "Domrov LMS - Cloud Architecture",
    show=False,
    direction="LR",
    filename="domrov_architecture_v2",
    graph_attr=graph_attr,
):

    user = Users("Students/Instructors")
    dns = Route53("Route 53")

    with Cluster("AWS Cloud (Region: ap-southeast-1)"):

        # --- FRONTEND ---
        with Cluster("Frontend Static Hosting"):
            cf = CloudFront("CloudFront CDN")
            s3_frontend = S3("S3 - Frontend Assets")

        # --- PUBLIC NETWORK ---
        with Cluster("Public Subnet"):
            alb = ELB("Application Load Balancer")

        # --- APPLICATION LAYER ---
        with Cluster("Private Subnet - Logic"):

            with Cluster("API Cluster (NestJS)"):
                nestjs_nodes = [EC2("API Node 1"), EC2("API Node 2")]
                nestjs_asg = AutoScaling("ASG (NestJS)")

            with Cluster("Compute Cluster (Python Workers)"):
                python_nodes = [EC2("Worker 1"), EC2("Worker 2")]
                python_asg = AutoScaling("ASG (Workers)")

        # --- DATA LAYER ---
        with Cluster("Private Subnet - Storage"):
            db_primary = RDS("RDS PostgreSQL (Multi-AZ)")
            redis = ElastiCache("Redis (ElastiCache)")
            s3_data = S3("S3 - User Files")

    # --- USER FLOW ---
    user >> dns >> cf >> s3_frontend
    dns >> alb >> nestjs_nodes

    # --- INTERNAL COMMUNICATION ---
    for api in nestjs_nodes:
        api >> Edge(label="gRPC", color="darkgreen") >> python_nodes

    # --- DATA ACCESS ---
    nestjs_nodes >> db_primary
    nestjs_nodes >> redis
    nestjs_nodes >> s3_data

    python_nodes >> redis
    python_nodes >> s3_data