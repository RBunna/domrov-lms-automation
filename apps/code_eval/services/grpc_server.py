import os
import grpc
from concurrent import futures
from protos.out_proto import submission_pb2, submission_pb2_grpc
from utils.find_file import read_file_to_json


class SubmissionServicer(submission_pb2_grpc.SubmissionServiceServicer):
    def ProcessSubmission(self, request, context):
        submission_id = request.submission_id
        file_path = "files_cache/" + submission_id + "/" + request.file_path
        try:
            file_data = read_file_to_json(file_path)
            if not file_data:
                raise FileNotFoundError(f"{file_path} does not exist or is empty")

            file_obj = submission_pb2.FileContent(
                type=file_data.get("type", "file"),
                name=file_data.get("name", ""),
                path=file_data.get("path", ""),
                content=file_data.get("content", []),
            )

            return submission_pb2.SubmissionResponse(
                success=True, message="File processed", file=file_obj
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(e))
            return submission_pb2.SubmissionResponse()


def start_grpc_server():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=5))
    submission_pb2_grpc.add_SubmissionServiceServicer_to_server(
        SubmissionServicer(), server
    )
    server.add_insecure_port(
        f"{os.getenv('CODE_EVAL_GRPC_HOST')}:{os.getenv('CODE_EVAL_GRPC_PORT')}"
    )
    server.start()
    print("gRPC server running on port 50051")
    server.wait_for_termination()
