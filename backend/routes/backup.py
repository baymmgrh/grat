"""
Backup & Restore API
====================
Handles database backup creation, restoration, and management.
"""

from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from datetime import datetime
import os
import shutil
import zipfile
import tempfile
from utils.timezone import get_local_now, get_local_today

backup_bp = Blueprint('backup', __name__)

def get_db_path():
    """Get the actual database path from app config"""
    db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if db_uri.startswith('sqlite:///'):
        db_path = db_uri.replace('sqlite:///', '')
        # Handle relative paths
        if not os.path.isabs(db_path):
            db_path = os.path.join(current_app.instance_path, db_path)
        return db_path
    return None

def get_backup_dir():
    """Get backup directory path"""
    backup_dir = os.path.join(current_app.instance_path, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir

def get_backup_metadata_file():
    """Get path to backup metadata JSON file"""
    return os.path.join(get_backup_dir(), 'backup_metadata.json')

def load_backup_metadata():
    """Load backup metadata from JSON file"""
    import json
    metadata_file = get_backup_metadata_file()
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            return json.load(f)
    return {'backups': [], 'settings': {
        'auto_backup_enabled': False,
        'backup_frequency': 'daily',
        'backup_time': '02:00',
        'retention_days': 30,
        'include_files': True,
        'compress_backup': True
    }}

def save_backup_metadata(metadata):
    """Save backup metadata to JSON file"""
    import json
    metadata_file = get_backup_metadata_file()
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)


@backup_bp.route('/backups', methods=['GET'])
@jwt_required()
def get_backups():
    """Get list of all backups"""
    try:
        metadata = load_backup_metadata()
        backups = metadata.get('backups', [])
        
        # Verify files still exist and update status
        backup_dir = get_backup_dir()
        valid_backups = []
        for backup in backups:
            file_path = os.path.join(backup_dir, backup['filename'])
            if os.path.exists(file_path):
                # Update file size
                backup['size'] = os.path.getsize(file_path)
                valid_backups.append(backup)
        
        # Sort by date descending
        valid_backups.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({'backups': valid_backups}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backups/create', methods=['POST'])
@jwt_required()
def create_backup():
    """Create a new database backup"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        description = data.get('description', '')
        
        db_path = get_db_path()
        if not db_path or not os.path.exists(db_path):
            return jsonify({'error': 'Database file not found'}), 404
        
        backup_dir = get_backup_dir()
        timestamp = get_local_now().strftime('%Y-%m-%d_%H-%M-%S')
        
        # Load settings
        metadata = load_backup_metadata()
        settings = metadata.get('settings', {})
        compress = settings.get('compress_backup', True)
        
        if compress:
            filename = f'backup_{timestamp}.zip'
            backup_path = os.path.join(backup_dir, filename)
            
            # Create zip file with database
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(db_path, 'database.db')
                
                # Include uploaded files if enabled
                if settings.get('include_files', True):
                    uploads_dir = os.path.join(current_app.instance_path, 'uploads')
                    if os.path.exists(uploads_dir):
                        for root, dirs, files in os.walk(uploads_dir):
                            for file in files:
                                file_path = os.path.join(root, file)
                                arcname = os.path.relpath(file_path, current_app.instance_path)
                                zipf.write(file_path, arcname)
        else:
            filename = f'backup_{timestamp}.db'
            backup_path = os.path.join(backup_dir, filename)
            shutil.copy2(db_path, backup_path)
        
        file_size = os.path.getsize(backup_path)
        
        # Create backup record
        backup_record = {
            'id': len(metadata.get('backups', [])) + 1,
            'filename': filename,
            'size': file_size,
            'created_at': get_local_now().isoformat(),
            'backup_type': 'manual',
            'status': 'completed',
            'description': description or f'Manual backup by user {user_id}',
            'created_by': user_id
        }
        
        # Add to metadata
        if 'backups' not in metadata:
            metadata['backups'] = []
        metadata['backups'].append(backup_record)
        save_backup_metadata(metadata)
        
        return jsonify({
            'message': 'Backup created successfully',
            'backup': backup_record
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backups/<int:backup_id>/restore', methods=['POST'])
@jwt_required()
def restore_backup(backup_id):
    """Restore database from backup"""
    try:
        metadata = load_backup_metadata()
        backups = metadata.get('backups', [])
        
        # Find backup by ID
        backup = next((b for b in backups if b['id'] == backup_id), None)
        if not backup:
            return jsonify({'error': 'Backup not found'}), 404
        
        backup_dir = get_backup_dir()
        backup_path = os.path.join(backup_dir, backup['filename'])
        
        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup file not found'}), 404
        
        db_path = get_db_path()
        if not db_path:
            return jsonify({'error': 'Database path not configured'}), 500
        
        # Create a backup of current database before restore
        pre_restore_backup = os.path.join(backup_dir, f'pre_restore_{get_local_now().strftime("%Y%m%d_%H%M%S")}.db')
        if os.path.exists(db_path):
            shutil.copy2(db_path, pre_restore_backup)
        
        # Close all database connections
        db.session.remove()
        db.engine.dispose()
        
        # Restore based on file type
        if backup['filename'].endswith('.zip'):
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                # Extract database
                with zipf.open('database.db') as src:
                    with open(db_path, 'wb') as dst:
                        dst.write(src.read())
                
                # Extract uploaded files if present
                uploads_dir = os.path.join(current_app.instance_path, 'uploads')
                for name in zipf.namelist():
                    if name.startswith('uploads/'):
                        zipf.extract(name, current_app.instance_path)
        else:
            shutil.copy2(backup_path, db_path)
        
        return jsonify({
            'message': 'Backup restored successfully. Please restart the application.',
            'pre_restore_backup': os.path.basename(pre_restore_backup)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backups/<int:backup_id>/download', methods=['GET'])
@jwt_required()
def download_backup(backup_id):
    """Download a backup file"""
    try:
        metadata = load_backup_metadata()
        backups = metadata.get('backups', [])
        
        backup = next((b for b in backups if b['id'] == backup_id), None)
        if not backup:
            return jsonify({'error': 'Backup not found'}), 404
        
        backup_dir = get_backup_dir()
        backup_path = os.path.join(backup_dir, backup['filename'])
        
        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup file not found'}), 404
        
        return send_file(
            backup_path,
            as_attachment=True,
            download_name=backup['filename']
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backups/<int:backup_id>', methods=['DELETE'])
@jwt_required()
def delete_backup(backup_id):
    """Delete a backup"""
    try:
        metadata = load_backup_metadata()
        backups = metadata.get('backups', [])
        
        backup = next((b for b in backups if b['id'] == backup_id), None)
        if not backup:
            return jsonify({'error': 'Backup not found'}), 404
        
        # Delete file
        backup_dir = get_backup_dir()
        backup_path = os.path.join(backup_dir, backup['filename'])
        if os.path.exists(backup_path):
            os.remove(backup_path)
        
        # Remove from metadata
        metadata['backups'] = [b for b in backups if b['id'] != backup_id]
        save_backup_metadata(metadata)
        
        return jsonify({'message': 'Backup deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backup-config', methods=['GET'])
@jwt_required()
def get_backup_config():
    """Get backup settings"""
    try:
        metadata = load_backup_metadata()
        settings = metadata.get('settings', {
            'auto_backup_enabled': False,
            'backup_frequency': 'daily',
            'backup_time': '02:00',
            'retention_days': 30,
            'include_files': True,
            'compress_backup': True
        })
        return jsonify({'settings': settings}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backup-config', methods=['POST'])
@jwt_required()
def save_backup_config():
    """Save backup settings"""
    try:
        data = request.get_json()
        
        metadata = load_backup_metadata()
        metadata['settings'] = {
            'auto_backup_enabled': data.get('auto_backup_enabled', False),
            'backup_frequency': data.get('backup_frequency', 'daily'),
            'backup_time': data.get('backup_time', '02:00'),
            'retention_days': data.get('retention_days', 30),
            'include_files': data.get('include_files', True),
            'compress_backup': data.get('compress_backup', True)
        }
        save_backup_metadata(metadata)
        
        return jsonify({'message': 'Settings saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@backup_bp.route('/backups/upload', methods=['POST'])
@jwt_required()
def upload_backup():
    """Upload a backup file for restoration"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        allowed_extensions = {'.db', '.zip'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Only .db and .zip files are allowed'}), 400
        
        backup_dir = get_backup_dir()
        timestamp = get_local_now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'uploaded_{timestamp}{ext}'
        backup_path = os.path.join(backup_dir, filename)
        
        file.save(backup_path)
        file_size = os.path.getsize(backup_path)
        
        # Add to metadata
        metadata = load_backup_metadata()
        backup_record = {
            'id': len(metadata.get('backups', [])) + 1,
            'filename': filename,
            'size': file_size,
            'created_at': get_local_now().isoformat(),
            'backup_type': 'uploaded',
            'status': 'completed',
            'description': f'Uploaded: {file.filename}',
            'created_by': get_jwt_identity()
        }
        
        if 'backups' not in metadata:
            metadata['backups'] = []
        metadata['backups'].append(backup_record)
        save_backup_metadata(metadata)
        
        return jsonify({
            'message': 'Backup uploaded successfully',
            'backup': backup_record
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
