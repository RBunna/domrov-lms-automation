import os
import boto3
from utils.extract_file import extract_file
from utils.git_handle import clone_repo


# ---------------- R2 Client ----------------
def get_r2_client():
    """
    Get R2 client from environment variables:
    R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET
    """
    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key = os.getenv("R2_ACCESS_KEY")
    secret_key = os.getenv("R2_SECRET_KEY")
    bucket = os.getenv("R2_BUCKET")

    if not all([account_id, access_key, secret_key, bucket]):
        raise EnvironmentError(
            "Please set R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET env vars"
        )

    s3 = boto3.client(
        service_name="s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    return s3, bucket


# ---------------- Download prefix from R2 ----------------
def download_prefix_from_r2(prefix: str, destination_folder: str) -> list[str]:
    """
    Download all files under a given R2 prefix into destination_folder.
    Extract zip/tar archives into folders, delete archive if needed.
    Returns a list of paths to files/folders ready to use.
    """
    os.makedirs(destination_folder, exist_ok=True)
    s3, bucket = get_r2_client()
    final_paths = []

    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if key.endswith("/"):  # skip folder keys
                continue

            filename = os.path.basename(key)
            local_path = os.path.join(destination_folder, filename)

            # Download file from R2
            response = s3.get_object(Bucket=bucket, Key=key)
            with open(local_path, "wb") as f:
                f.write(response["Body"].read())

            # Check for archives
            if filename.lower().endswith((".zip", ".tar", ".tar.gz", ".tgz")):
                # Extract into a folder named after archive
                archive_folder = os.path.join(
                    destination_folder, os.path.splitext(filename)[0]
                )
                os.makedirs(archive_folder, exist_ok=True)

                extracted_paths = extract_file(local_path, archive_folder)
                if isinstance(extracted_paths, list):
                    final_paths.append(archive_folder)  # keep folder for multiple files
                else:
                    final_paths.append(extracted_paths)  # single file

                print(f"✅ Extracted archive: {key} -> {archive_folder}")
            else:
                # Regular file
                final_paths.append(local_path)
                print(f"✅ Downloaded file: {key} -> {local_path}")

    if not final_paths:
        print(f"⚠️ No files found under prefix: {prefix}")

    return final_paths


# ---------------- Unified downloadFiles ----------------
import os


def downloadFiles(url: str, folder_name: str) -> str:
    dest = os.path.join("/files_cache", str(folder_name))

    # 1. Create the folder if it doesn't exist
    os.makedirs(dest, exist_ok=True)

    # 2. FORCE the folder to be 777 (drwxrwxrwx)
    # This allows the git clone process to write files inside
    try:
        os.chmod(dest, 0o777)
        print(f"DEBUG: Successfully set 777 permissions on {dest}", flush=True)
    except Exception as e:
        print(f"DEBUG: Failed to set permissions: {e}", flush=True)

    # 3. Now perform the clone
    if "github.com" in url:
        clone_repo(url, "/files_cache", str(folder_name))

    return dest
