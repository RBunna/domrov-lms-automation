import grpc
from utils.find_file import read_file_to_json
from utils.find_file import is_dir_cache, read_file_to_json
from protos import submission_pb2, submission_pb2_grpc
from config.grpc_config import EvaluateClient
from utils.download_file_r2 import downloadFiles


class SubmissionServicer(submission_pb2_grpc.SubmissionServiceServicer):
    def ProcessSubmission(self, request, context):
        submission_id = request.submission_id
        file_path = "files_cache/" + submission_id + "/" + request.file_path
        if not is_dir_cache("/files_cache", file_path):
            client = EvaluateClient()
            result = client.get_submission_resource(int(submission_id))
            downloadFiles(url=result.get("resource_url"), folder_name="/files_cache/")
        pass
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
