import os
import re

def remove_comments(text):
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'):
            return " " # note: a space and not an empty string
        else:
            return s
    pattern = re.compile(
        r'//.*?$|/\*.*?\*/|\'(?:\\.|[^\\\'])*\'|"(?:\\.|[^\\"])*"',
        re.DOTALL | re.MULTILINE
    )
    return re.sub(pattern, replacer, text)

def clean_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = remove_comments(content)
        
        # Remove empty lines left by deleted comments (optional, but cleaner)
        # This simple regex removes lines that are empty or contain only whitespace
        # new_content = re.sub(r'^\s*$\n', '', new_content, flags=re.MULTILINE)

        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Cleaned: {file_path}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

def main():
    target_dir = os.path.join(os.getcwd(), 'back', 'src')
    extensions = ('.ts', '.tsx', '.js', '.jsx', '.css', '.scss')
    
    print(f"Scanning directory: {target_dir}")
    
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(extensions):
                file_path = os.path.join(root, file)
                clean_file(file_path)

if __name__ == "__main__":
    main()
