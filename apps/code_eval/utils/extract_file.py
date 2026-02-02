import os
import patoolib
def extract_file(filePath: str, destinationFolder: str) -> str:
    os.makedirs(destinationFolder, exist_ok=True)
    
    if(filePath.endswith('.zip') or filePath.endswith('.tar') or 
        filePath.endswith('.tar.gz') or filePath.endswith('.tgz') or 
        filePath.endswith('.rar') or filePath.endswith('.7z')):
        
        patoolib.extract_archive(filePath, outdir=destinationFolder)
        print(f"Extracted {filePath} to {destinationFolder}")
        os.remove(filePath)
        return os.path.join(destinationFolder, os.path.splitext(os.path.basename(filePath))[0])  
    return filePath
    