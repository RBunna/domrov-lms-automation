import React, { useState } from "react";
import { FileUploader } from "./components/FileUploader";
import { FileDownloader } from "./components/FIleDownloader";

const App: React.FC = () => {
  const [token, setToken] = useState(""); // JWT token input

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Upload File to R2</h1>

      {/* JWT token input */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          JWT Token:{" "}
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: "400px" }}
          />
        </label>
      </div>

      <FileUploader
        presignedUrlEndpoint="http://localhost:3000/file/presigned-url"
        notifyEndpoint="http://localhost:3000/file/notify-upload"
        token={token}
        resourceId={2}
        resourceType="assessment"
        onUploadSuccess={(key) => console.log("Uploaded:", key)}
        onUploadError={(err) => console.error("Error:", err)}
      />
      <div>
        <h1>Download File from R2 via Backend</h1>
        <FileDownloader
          resourceId={3} // resource ID from DB
          downloadEndpoint="http://localhost:3000/file/download/"
          token={token}
        />
      </div>
    </div>
  );
};

export default App;
