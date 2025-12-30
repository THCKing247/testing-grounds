"""Test script to check if services can be imported"""
import sys
import os
import importlib.util

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

def load_service(module_name, class_name):
    """Load a service class from a file with numeric prefix"""
    file_path = os.path.join(parent_dir, module_name)
    if not os.path.exists(file_path):
        print(f"ERROR: File not found: {file_path}")
        return None
    valid_name = f"service_{module_name.replace('.py', '').replace('_', '')}"
    spec = importlib.util.spec_from_file_location(valid_name, file_path)
    if spec is None or spec.loader is None:
        print(f"ERROR: Could not load spec for {module_name}")
        return None
    module = importlib.util.module_from_spec(spec)
    sys.modules[valid_name] = module
    try:
        spec.loader.exec_module(module)
        if not hasattr(module, class_name):
            print(f"ERROR: Class {class_name} not found in {module_name}")
            return None
        print(f"OK: Successfully loaded {class_name} from {module_name}")
        return getattr(module, class_name)
    except Exception as e:
        print(f"ERROR: Error loading {module_name}: {e}")
        import traceback
        traceback.print_exc()
        return None

# Test loading services
print("Testing service imports...\n")
services = [
    ('1_data_clean_engine.py', 'ApexDataCleanEngine'),
    ('2_voice_of_customer.py', 'VoiceOfCustomerInsightsSystem'),
    ('3_ai_content_operations.py', 'AIContentOperationsSystem'),
]

for module_name, class_name in services:
    load_service(module_name, class_name)
    print()

