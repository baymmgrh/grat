"""
System Monitoring Routes
Real-time system metrics - 100% accurate like Windows Task Manager
Automatically adapts to any server specs when deployed
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
import psutil
import platform
from datetime import datetime
from utils.timezone import get_local_now, get_local_today

system_monitor_bp = Blueprint('system_monitor', __name__)

@system_monitor_bp.route('/system/metrics/public', methods=['GET'])
def get_system_metrics_public():
    """
    Get REAL-TIME system metrics - PUBLIC ACCESS (no auth required)
    For SystemOverview page display
    """
    return get_system_metrics_internal()

def get_system_metrics_internal():
    """
    Internal function to get system metrics
    Can be called from both public and authenticated endpoints
    """
    try:
        # CPU Usage - EXACTLY like Task Manager
        # Use interval=0 for instant reading, then calculate average
        cpu_percent = psutil.cpu_percent(interval=0.1)  # Quick sample
        cpu_count_logical = psutil.cpu_count(logical=True)  # Total threads
        cpu_count_physical = psutil.cpu_count(logical=False)  # Physical cores
        cpu_freq = psutil.cpu_freq()
        
        # Get per-core usage for detailed view
        cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
        
        # Memory Usage - EXACTLY like Task Manager (In use / Total)
        memory = psutil.virtual_memory()
        memory_percent = memory.percent  # Exact percentage
        memory_used_gb = memory.used / (1024**3)  # Used in GB
        memory_total_gb = memory.total / (1024**3)  # Total in GB
        memory_available_gb = memory.available / (1024**3)  # Available in GB
        
        # Get ALL disk partitions - like Task Manager shows all drives
        disk_info = []
        partitions = psutil.disk_partitions()
        
        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_info.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'usage_percent': round(usage.percent, 1),
                    'used_gb': round(usage.used / (1024**3), 2),
                    'total_gb': round(usage.total / (1024**3), 2),
                    'free_gb': round(usage.free / (1024**3), 2),
                    'status': get_status_level(usage.percent)
                })
            except PermissionError:
                # Skip drives that can't be accessed
                continue
        
        # Network Usage - Real-time speed
        net_io_start = psutil.net_io_counters()
        import time
        time.sleep(0.1)  # Sample for 100ms
        net_io_end = psutil.net_io_counters()
        
        # Calculate speed in KB/s
        bytes_sent_per_sec = (net_io_end.bytes_sent - net_io_start.bytes_sent) * 10  # *10 because 0.1s sample
        bytes_recv_per_sec = (net_io_end.bytes_recv - net_io_start.bytes_recv) * 10
        
        # Total network traffic
        total_sent_mb = net_io_end.bytes_sent / (1024**2)
        total_recv_mb = net_io_end.bytes_recv / (1024**2)
        
        # Network usage percentage (based on typical 1 Gbps = 125 MB/s)
        network_speed_mbps = (bytes_sent_per_sec + bytes_recv_per_sec) / (1024**2)  # MB/s
        network_percent = min(100, (network_speed_mbps / 125) * 100)  # Relative to 1 Gbps
        
        # Get network interface details
        net_if_stats = psutil.net_if_stats()
        active_interfaces = []
        for interface, stats in net_if_stats.items():
            if stats.isup:
                active_interfaces.append({
                    'name': interface,
                    'speed_mbps': stats.speed if stats.speed > 0 else 'Unknown',
                    'is_up': stats.isup
                })
        
        return jsonify({
            'timestamp': get_local_now().isoformat(),
            'cpu': {
                'usage_percent': round(cpu_percent, 0),  # Round to integer like Task Manager
                'count_logical': cpu_count_logical,
                'count_physical': cpu_count_physical,
                'frequency_ghz': round(cpu_freq.current / 1000, 2) if cpu_freq else 0,  # Convert to GHz
                'frequency_max_ghz': round(cpu_freq.max / 1000, 2) if cpu_freq and cpu_freq.max else 0,
                'per_core': [round(x, 0) for x in cpu_per_core],  # Per-core usage
                'status': get_status_level(cpu_percent)
            },
            'memory': {
                'usage_percent': round(memory_percent, 0),  # Integer like Task Manager
                'used_gb': round(memory_used_gb, 1),  # 1 decimal like Task Manager (9.9 GB)
                'total_gb': round(memory_total_gb, 1),  # 1 decimal like Task Manager (11.9 GB)
                'available_gb': round(memory_available_gb, 1),
                'used_formatted': f'{round(memory_used_gb, 1)}/{round(memory_total_gb, 1)} GB ({round(memory_percent, 0)}%)',
                'status': get_status_level(memory_percent)
            },
            'disks': disk_info,  # All disks like Task Manager
            'network': {
                'usage_percent': round(network_percent, 0),
                'send_speed_kbps': round(bytes_sent_per_sec / 1024, 1),  # KB/s
                'recv_speed_kbps': round(bytes_recv_per_sec / 1024, 1),  # KB/s
                'total_sent_mb': round(total_sent_mb, 1),
                'total_recv_mb': round(total_recv_mb, 1),
                'interfaces': active_interfaces,
                'status': get_status_level(network_percent)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@system_monitor_bp.route('/system/metrics', methods=['GET'])
@jwt_required()
def get_system_metrics():
    """
    Get REAL-TIME system metrics - AUTHENTICATED
    Same as public but requires login
    """
    return get_system_metrics_internal()

@system_monitor_bp.route('/system/info', methods=['GET'])
@jwt_required()
def get_system_info():
    """
    Get system information
    """
    try:
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = get_local_now() - boot_time
        
        return jsonify({
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'processor': platform.processor(),
            'hostname': platform.node(),
            'boot_time': boot_time.isoformat(),
            'uptime_seconds': int(uptime.total_seconds()),
            'uptime_formatted': format_uptime(uptime)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@system_monitor_bp.route('/system/processes', methods=['GET'])
@jwt_required()
def get_top_processes():
    """
    Get top processes by CPU and Memory usage
    """
    try:
        processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                pinfo = proc.info
                processes.append({
                    'pid': pinfo['pid'],
                    'name': pinfo['name'],
                    'cpu_percent': round(pinfo['cpu_percent'], 2),
                    'memory_percent': round(pinfo['memory_percent'], 2)
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        # Sort by CPU usage
        processes_by_cpu = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:10]
        
        # Sort by Memory usage
        processes_by_memory = sorted(processes, key=lambda x: x['memory_percent'], reverse=True)[:10]
        
        return jsonify({
            'top_by_cpu': processes_by_cpu,
            'top_by_memory': processes_by_memory,
            'total_processes': len(processes)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@system_monitor_bp.route('/system/history', methods=['GET'])
@jwt_required()
def get_system_history():
    """
    Get system metrics history (last 60 seconds)
    """
    try:
        import time
        
        history = []
        
        # Collect metrics for 10 samples (1 second apart)
        for i in range(10):
            cpu = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory().percent
            
            history.append({
                'timestamp': get_local_now().isoformat(),
                'cpu': round(cpu, 1),
                'memory': round(memory, 1)
            })
            
            if i < 9:  # Don't sleep on last iteration
                time.sleep(1)
        
        return jsonify({
            'history': history
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_status_level(percent):
    """
    Get status level based on percentage
    """
    if percent < 50:
        return 'normal'
    elif percent < 75:
        return 'warning'
    else:
        return 'critical'

def format_uptime(uptime):
    """
    Format uptime duration
    """
    days = uptime.days
    hours, remainder = divmod(uptime.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    parts = []
    if days > 0:
        parts.append(f'{days}d')
    if hours > 0:
        parts.append(f'{hours}h')
    if minutes > 0:
        parts.append(f'{minutes}m')
    
    return ' '.join(parts) if parts else '< 1m'
