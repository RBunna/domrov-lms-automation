import os
import sys
import grpc

# Add the specific folder where evaluate_pb2 lives to the system path
# This prevents the ModuleNotFoundError without editing the proto files
proto_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "protos", "out_proto"))
if proto_dir not in sys.path:
    sys.path.insert(0, proto_dir)

# Now these imports will work because Python can see evaluate_pb2 at the 'top' level
from protos import evaluate_pb2, evaluate_pb2_grpc

class EvaluateClient:

    def __init__(self, host=os.getenv("BACKEND_HOST"), port=os.getenv("BACKEND_PORT")):
        self.server_address = f"{host}:{port}"
        self.channel = grpc.insecure_channel(self.server_address)
        self.stub = evaluate_pb2_grpc.EvaluateWithAIStub(self.channel)

    def evaluate_submission(
        self,
        submission_id: str,
        scores: list[float],
        feedback: str,
        input_token: int = 0,
        output_token: int = 0
    ):
        # Build request
        request = evaluate_pb2.EvaluateRequest(
            submission_id=str(submission_id),
            score=evaluate_pb2.ScoreCriteria(value=scores),
            feedback=feedback,
            input_token=input_token,
            output_token=output_token
        )
        # Call RPC
        response = self.stub.EvaluateSubmission(request)
        return response
