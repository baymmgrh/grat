"""
Script to fix timezone issues across all backend files
Replaces datetime.now(), date.today(), datetime.utcnow() with local timezone functions
"""
import os
import re

ROUTES_DIR = os.path.join(os.path.dirname(__file__), 'routes')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Import line to add
TIMEZONE_IMPORT_ROUTES = "from utils.timezone import get_local_now, get_local_today"
TIMEZONE_IMPORT_MODELS = "from utils.timezone import get_local_now"

# Files to skip (already fixed)
SKIP_FILES = ['attendance.py', '__init__.py', '__pycache__']

def fix_file(filepath, is_model=False):
    """Fix timezone issues in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Check if file uses datetime.now(), date.today(), or datetime.utcnow()
        has_datetime_now = 'datetime.now()' in content
        has_date_today = 'date.today()' in content
        has_utcnow = 'datetime.utcnow()' in content
        
        if not (has_datetime_now or has_date_today or has_utcnow):
            return False, "No changes needed"
        
        # Choose appropriate import
        tz_import = TIMEZONE_IMPORT_MODELS if is_model else TIMEZONE_IMPORT_ROUTES
        
        # Check if already has timezone import
        if 'from utils.timezone import' in content:
            pass
        else:
            # Add import after other imports
            lines = content.split('\n')
            import_end_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('from ') or line.startswith('import '):
                    import_end_idx = i
            
            lines.insert(import_end_idx + 1, tz_import)
            content = '\n'.join(lines)
        
        # Replace datetime.now() with get_local_now()
        content = re.sub(r'datetime\.now\(\)', 'get_local_now()', content)
        
        # Replace date.today() with get_local_today()
        content = re.sub(r'date\.today\(\)', 'get_local_today()', content)
        
        # Replace datetime.utcnow() with get_local_now()
        content = re.sub(r'datetime\.utcnow\(\)', 'get_local_now()', content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Fixed"
        
        return False, "No changes made"
        
    except Exception as e:
        return False, str(e)

def process_directory(directory, is_model=False):
    """Process all Python files in a directory"""
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filename in os.listdir(directory):
        if filename in SKIP_FILES or not filename.endswith('.py'):
            continue
        
        filepath = os.path.join(directory, filename)
        success, message = fix_file(filepath, is_model=is_model)
        
        if success:
            print(f"✅ {filename}: {message}")
            fixed_count += 1
        elif message == "No changes needed":
            skipped_count += 1
        else:
            print(f"❌ {filename}: {message}")
            error_count += 1
    
    return fixed_count, skipped_count, error_count

def main():
    """Fix all route and model files"""
    total_fixed = 0
    total_skipped = 0
    total_errors = 0
    
    print("Fixing timezone issues in MODELS...")
    print("=" * 50)
    f, s, e = process_directory(MODELS_DIR, is_model=True)
    total_fixed += f
    total_skipped += s
    total_errors += e
    
    print("\n" + "=" * 50)
    print(f"TOTAL - Fixed: {total_fixed}, Skipped: {total_skipped}, Errors: {total_errors}")

if __name__ == '__main__':
    main()
