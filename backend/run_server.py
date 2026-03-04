"""
Production Server Script for Windows LAN
Run with: python run_server.py

This uses Waitress (Windows-compatible WSGI server) instead of Gunicorn
"""
from waitress import serve
from app import app
import os

if __name__ == '__main__':
    # Get configuration from environment or use defaults
    host = os.environ.get('FLASK_HOST', '0.0.0.0')  # 0.0.0.0 allows LAN access
    port = int(os.environ.get('FLASK_PORT', 5000))
    threads = int(os.environ.get('FLASK_THREADS', 4))
    
    print(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║           ERP FLASK - Production Server                      ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  Server running on: http://{host}:{port}                     
    ║  Threads: {threads}                                          
    ║  Press Ctrl+C to stop                                        
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    serve(app, host=host, port=port, threads=threads)
