import os
import sys
import time
import subprocess
import signal

def main():
    print("=" * 60)
    print("🚀 Starting AIVOA QMS Complaint System (Full Stack)...")
    print("=" * 60)

    # Determine Python executable (prefer project venv if available)
    root_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(root_dir, "venv", "Scripts", "python.exe")
    if os.path.exists(venv_python):
        python_bin = venv_python
    else:
        python_bin = sys.executable

    # 1. Launch FastAPI Backend Server
    backend_script = os.path.join(root_dir, "backend", "main.py")
    print(f"📦 Starting FastAPI Backend Server on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen([python_bin, backend_script], cwd=root_dir)

    time.sleep(2)

    # 2. Launch Vite Frontend Dev Server
    frontend_dir = os.path.join(root_dir, "frontend")
    print(f"⚡ Starting Vite Frontend Dev Server on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)

    print("\n" + "=" * 60)
    print("✅ System fully active!")
    print("👉 Frontend UI: http://localhost:3000 (or http://localhost:5173)")
    print("👉 Backend API: http://localhost:8000")
    print("=" * 60 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
