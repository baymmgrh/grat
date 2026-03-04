from flask import Blueprint, request, jsonify
from models import db
from models.hr import StaffFace
import json
import base64
import os
from datetime import datetime

face_bp = Blueprint('face', __name__, url_prefix='/api/face')

def cors_preflight_response():
    """Handle CORS preflight requests"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response


def get_face_encoding_from_image(image_data):
    """Extract face encoding from base64 image data"""
    try:
        import face_recognition
        import numpy as np
        from PIL import Image
        from io import BytesIO
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Find faces and get encodings
        face_locations = face_recognition.face_locations(image_array)
        
        if len(face_locations) == 0:
            return None, "Tidak ada wajah terdeteksi dalam foto"
        
        if len(face_locations) > 1:
            return None, "Terdeteksi lebih dari 1 wajah. Pastikan hanya ada 1 wajah dalam foto"
        
        # Get face encoding
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if len(face_encodings) == 0:
            return None, "Gagal mengekstrak encoding wajah"
        
        return face_encodings[0].tolist(), None
        
    except ImportError:
        return None, "Library face_recognition belum terinstall"
    except Exception as e:
        return None, f"Error processing image: {str(e)}"


def find_matching_face(face_encoding, tolerance=0.5):
    """Find matching face from database"""
    try:
        import face_recognition
        import numpy as np
        
        # Get all active staff faces
        staff_faces = StaffFace.query.filter_by(is_active=True).all()
        
        if not staff_faces:
            return None, None
        
        # Convert input encoding to numpy array
        input_encoding = np.array(face_encoding)
        
        best_match = None
        best_distance = tolerance
        
        for staff in staff_faces:
            stored_encoding = np.array(json.loads(staff.face_encoding))
            
            # Calculate face distance
            distance = face_recognition.face_distance([stored_encoding], input_encoding)[0]
            
            if distance < best_distance:
                best_distance = distance
                best_match = staff
        
        if best_match:
            confidence = round((1 - best_distance) * 100, 1)
            return best_match, confidence
        
        return None, None
        
    except Exception as e:
        print(f"Error matching face: {e}")
        return None, None


@face_bp.route('/register', methods=['POST', 'OPTIONS'])
def register_face():
    """Register a new staff face"""
    if request.method == 'OPTIONS':
        return cors_preflight_response()
    
    try:
        data = request.get_json()
        
        name = data.get('name', '').strip()
        jabatan = data.get('jabatan', '').strip()
        departemen = data.get('departemen', '').strip()
        photo = data.get('photo', '')
        
        if not name:
            return jsonify({'error': 'Nama wajib diisi'}), 400
        
        if not photo:
            return jsonify({'error': 'Foto wajib diambil'}), 400
        
        # Format name to proper case
        name = ' '.join(word.capitalize() for word in name.split())
        
        # Check if name already registered
        existing = StaffFace.query.filter(
            db.func.lower(StaffFace.name) == name.lower(),
            StaffFace.is_active == True
        ).first()
        
        if existing:
            return jsonify({'error': f'Nama "{name}" sudah terdaftar'}), 400
        
        # Extract face encoding
        encoding, error = get_face_encoding_from_image(photo)
        
        if error:
            return jsonify({'error': error}), 400
        
        # Save photo to disk (optional)
        photo_path = None
        try:
            upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'faces')
            os.makedirs(upload_dir, exist_ok=True)
            
            filename = f"{name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            photo_path = os.path.join('uploads', 'faces', filename)
            
            # Save image
            if ',' in photo:
                photo_data = photo.split(',')[1]
            else:
                photo_data = photo
            
            with open(os.path.join(upload_dir, filename), 'wb') as f:
                f.write(base64.b64decode(photo_data))
        except Exception as e:
            print(f"Warning: Could not save photo: {e}")
        
        # Create staff face record
        staff_face = StaffFace(
            name=name,
            jabatan=jabatan if jabatan else None,
            departemen=departemen if departemen else None,
            face_encoding=json.dumps(encoding),
            photo_path=photo_path,
            is_active=True
        )
        
        db.session.add(staff_face)
        db.session.flush()  # Get ID without closing session
        
        # Store values before commit
        result = {
            'id': staff_face.id,
            'name': name,
            'jabatan': jabatan if jabatan else None,
            'departemen': departemen if departemen else None,
            'is_active': True
        }
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Wajah {name} berhasil didaftarkan',
            'staff': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@face_bp.route('/recognize', methods=['POST', 'OPTIONS'])
def recognize_face():
    """Recognize a face from photo"""
    if request.method == 'OPTIONS':
        return cors_preflight_response()
    
    try:
        data = request.get_json()
        photo = data.get('photo', '')
        
        if not photo:
            return jsonify({'error': 'Foto wajib diambil'}), 400
        
        # Extract face encoding from uploaded photo
        encoding, error = get_face_encoding_from_image(photo)
        
        if error:
            return jsonify({'error': error, 'recognized': False}), 200
        
        # Find matching face
        match, confidence = find_matching_face(encoding)
        
        if match:
            return jsonify({
                'recognized': True,
                'name': match.name,
                'jabatan': match.jabatan,
                'departemen': match.departemen,
                'confidence': confidence
            }), 200
        else:
            return jsonify({
                'recognized': False,
                'message': 'Wajah tidak dikenali. Silakan registrasi terlebih dahulu.'
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e), 'recognized': False}), 500


@face_bp.route('/list', methods=['GET'])
def list_registered_faces():
    """List all registered staff faces"""
    try:
        # Debug: check table exists
        from sqlalchemy import text
        result_proxy = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='staff_faces'"))
        table_exists = result_proxy.fetchone()
        
        if not table_exists:
            return jsonify({
                'total': 0,
                'staff': [],
                'debug': 'Table staff_faces does not exist'
            }), 200
        
        # Simple raw query
        result_proxy = db.session.execute(text("SELECT id, name, jabatan, departemen, is_active, created_at FROM staff_faces WHERE is_active = 1 ORDER BY name"))
        rows = result_proxy.fetchall()
        
        result = []
        for row in rows:
            result.append({
                'id': row[0],
                'name': row[1],
                'jabatan': row[2],
                'departemen': row[3],
                'is_active': bool(row[4]),
                'created_at': str(row[5]) if row[5] else None
            })
        
        return jsonify({
            'total': len(result),
            'staff': result
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@face_bp.route('/delete/<int:id>', methods=['DELETE', 'OPTIONS'])
def delete_face(id):
    """Delete (deactivate) a registered face"""
    if request.method == 'OPTIONS':
        return cors_preflight_response()
    
    try:
        staff_face = StaffFace.query.get(id)
        
        if not staff_face:
            return jsonify({'error': 'Data tidak ditemukan'}), 404
        
        staff_face.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Data wajah {staff_face.name} berhasil dihapus'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
