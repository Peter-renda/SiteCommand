import os
# Configuration
OUTPUT_FILE = "codebase_summary.txt"
# Folders to skip
IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', 'dist', 'build', '.venv', 'env'}
# Extensions to include
INCLUDE_EXTS = {'.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt', '.yaml', '.yml'}
def flatten_repo(root_dir):
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(root_dir):
            # Skip ignored directories in-place
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                if any(file.endswith(ext) for ext in INCLUDE_EXTS):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, root_dir)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            content = infile.read()
                            # Formatting for the AI to understand file boundaries
                            outfile.write(f"\n\n--- FILE: {relative_path} ---\n")
                            outfile.write(content)
                            outfile.write(f"\n--- END OF FILE: {relative_path} ---\n")
                    except Exception as e:
                        print(f"Skipping {relative_path}: {e}")
if __name__ == "__main__":
    print(f"Flattening directory: {os.getcwd()}...")
    flatten_repo(".")
    print(f"Done! Created {OUTPUT_FILE}")
