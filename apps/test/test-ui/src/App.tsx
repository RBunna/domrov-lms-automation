import React from "react";
import { FileUploader } from "./components/FileUploader";

const App: React.FC = () => {
  return (
    <div>
      <h1>Upload File to R2</h1>
      <FileUploader
        presignedUrlEndpoint="http://localhost:3000/file/presigned-url"
        onUploadSuccess={(key) => console.log("Uploaded:", key)}
        onUploadError={(err) => console.error("Error:", err)}
      />
    </div>
  );
};

export default App;
