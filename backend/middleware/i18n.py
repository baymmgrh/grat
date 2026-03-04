"""
i18n middleware for Flask application
"""

from flask import request, g
from utils.i18n import i18n

def setup_i18n_middleware(app):
    """Setup i18n middleware for the Flask app"""
    
    @app.before_request
    def set_language():
        """Set language for the current request"""
        # Get language from Accept-Language header or custom header
        language = 'id'  # default
        
        if request.headers.get('Accept-Language'):
            accept_lang = request.headers.get('Accept-Language', '').lower()
            if 'en' in accept_lang:
                language = 'en'
            elif 'id' in accept_lang or 'indonesia' in accept_lang:
                language = 'id'
        
        # Custom header takes precedence
        if request.headers.get('X-Language'):
            custom_lang = request.headers.get('X-Language')
            if custom_lang in ['id', 'en']:
                language = custom_lang
        
        # Store in Flask g object for use in routes
        g.language = language
        
    return app
