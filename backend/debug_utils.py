#!/usr/bin/env python3

import inspect
from utils import generate_number

def debug_generate_number():
    """Debug the generate_number function"""
    print("=== DEBUGGING generate_number FUNCTION ===\n")
    
    print(f"Function: {generate_number}")
    print(f"Module: {generate_number.__module__}")
    print(f"File: {inspect.getfile(generate_number)}")
    
    # Get function signature
    sig = inspect.signature(generate_number)
    print(f"Signature: {sig}")
    
    # Get parameters
    params = sig.parameters
    print(f"Parameters: {list(params.keys())}")
    
    for name, param in params.items():
        print(f"  {name}: {param}")

if __name__ == '__main__':
    debug_generate_number()
