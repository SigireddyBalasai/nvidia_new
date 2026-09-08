#!/bin/bash
#SBATCH --job-name=nim-qwen38
#SBATCH --partition=hackathon
#SBATCH --gres=gpu:1
#SBATCH --nodes=1
#SBATCH --time=00:30:00
#SBATCH --nodelist=dgx04
#SBATCH --output=nim_%j.log
#SBATCH --error=nim_%j.err

# Model configuration - change this to switch models
MODEL_TAG="nvidia/qwen3.8-27b"
MODEL_VERSION="2.1.1-variant"
SIF_FILE="/home/gsh-yqnaq/qwen3.8-27b_2.1.1-variant.sif"
SANDBOX_DIR="/home/gsh-yqnaq/qwen3.8-27b_sandbox"

# Build sandbox once if not cached
if [ ! -d "$SANDBOX_DIR" ]; then
  echo "Building sandbox from SIF (one-time, ~5 min)..."
  apptainer build --sandbox "$SANDBOX_DIR" "$SIF_FILE"
  echo "Sandbox cached at: $SANDBOX_DIR"
else
  echo "Using cached sandbox: $SANDBOX_DIR"
fi

echo "=== Job started on $(hostname) at $(date) ==="
echo "Model: ${MODEL_TAG}:${MODEL_VERSION}"

# Cluster & Node Info
echo "=========================================="
echo "=== CLUSTER INFO ==="
echo "=========================================="
echo "SLURM Job ID: $SLURM_JOB_ID"
echo "SLURM Node: $SLURM_JOB_NODELIST"
echo "SLURM GPUs: $SLURM_GPUS_ON_NODE"

echo "=========================================="
echo "=== GPU INFO ==="
echo "=========================================="
nvidia-smi -L
nvidia-smi --query-gpu=index,name,memory.total,memory.free --format=csv,noheader

echo "=========================================="
echo "=== DISK INFO ==="
echo "=========================================="
df -h /home /tmp 2>/dev/null

echo "=========================================="
echo "=== APPTAINER VERSION ==="
echo "=========================================="
apptainer --version

# Pick a random available port
NIM_PORT=$(( (RANDOM % 10000) + 50000 ))
echo "=========================================="
echo "=== NIM SERVER ==="
echo "=========================================="
echo "Port: $NIM_PORT"
echo "NIM_PORT=$NIM_PORT" > /home/gsh-yqnaq/gsh-team20/nim_port.txt

# Create writable cache directories
mkdir -p /home/gsh-yqnaq/.nim_cache
mkdir -p /home/gsh-yqnaq/.nim_runtime_cache
mkdir -p /home/gsh-yqnaq/.nim_nginx
mkdir -p /home/gsh-yqnaq/.nim_tmp

# Run NIM container using its built-in entrypoint
echo "Starting NIM container..."
apptainer run --nv \
  --bind /home/gsh-yqnaq/.nim_cache:/opt/nim/.cache \
  --bind /home/gsh-yqnaq/.nim_runtime_cache:/opt/nim/runtime-cache \
  --bind /home/gsh-yqnaq/.nim_nginx:/opt/nim/nginx \
  --bind /home/gsh-yqnaq/.nim_tmp:/tmp \
  --env NIM_SERVER_PORT=$NIM_PORT \
  ${SANDBOX_DIR} &

NIM_PID=$!
echo "NIM PID: $NIM_PID"

# Wait for server to start with dynamic health check
echo "Waiting for model to load (max 10 minutes)..."
MODEL_READY=0
for i in $(seq 1 60); do
  sleep 10
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$NIM_PORT/v1/health/ready 2>/dev/null || echo "000")
  echo "  Attempt $i/60 - Health: $HEALTH"
  if [ "$HEALTH" = "200" ]; then
    echo "Model ready after $((i * 10)) seconds!"
    MODEL_READY=1
    break
  fi
  # Check if process died
  if ! kill -0 $NIM_PID 2>/dev/null; then
    echo "ERROR: NIM process died!"
    break
  fi
done

if [ "$MODEL_READY" -ne 1 ]; then
  echo "ERROR: Model failed to load within timeout"
  echo "=== NIM Process Status ==="
  ps aux | grep -E "sglang|nim" | grep -v grep
  wait $NIM_PID 2>/dev/null
  exit 1
fi

# Health check
echo "=== Health Check ==="
curl -s http://localhost:$NIM_PORT/v1/health/ready
echo ""

# List models
echo "=== Models ==="
curl -s http://localhost:$NIM_PORT/v1/models
echo ""

# Test query
MODEL_NAME=$(echo ${MODEL_TAG} | sed 's|nvidia/||')
echo "=== Test Query ==="
curl -s -X POST http://localhost:$NIM_PORT/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${MODEL_NAME}\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello, who are you?\"}],\"max_tokens\":100}"
echo ""

echo "=== Server ready at http://$(hostname):$NIM_PORT ==="
echo "=== Job finished at $(date) ==="
