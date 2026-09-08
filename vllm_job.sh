#!/bin/bash
#SBATCH --job-name=vllm-qwen38
#SBATCH --partition=hackathon
#SBATCH --gres=gpu:1
#SBATCH --nodes=1
#SBATCH --time=00:30:00
#SBATCH --nodelist=dgx04
#SBATCH --output=vllm_%j.log
#SBATCH --error=vllm_%j.err

# Model configuration
MODEL_PATH="/home/gsh-yqnaq/.cache/huggingface/hub/models--nvidia--Qwen3-8B/snapshots/xxx"
MODEL_NAME="nvidia/Qwen3-8B"
VLLM_PORT=$(( (RANDOM % 10000) + 50000 ))

echo "=== Job started on $(hostname) at $(date) ==="
echo "Model: ${MODEL_NAME}"

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

# Install vllm if needed
echo "=========================================="
echo "=== INSTALLING VLLM ==="
echo "=========================================="
pip install vllm

# Check for vllm
echo "=========================================="
echo "=== VLLM CHECK ==="
echo "=========================================="
which python3
python3 -c "import vllm; print(f'vLLM version: {vllm.__version__}')"

echo "=========================================="
echo "=== VLLM SERVER ==="
echo "=========================================="
echo "Port: $VLLM_PORT"
echo "VLLM_PORT=$VLLM_PORT" > /home/gsh-yqnaq/gsh-team20/vllm_port.txt

# Run vLLM server
echo "Starting vLLM server..."
python3 -m vllm.entrypoints.openai.api_server \
  --model $MODEL_NAME \
  --host 0.0.0.0 \
  --port $VLLM_PORT \
  --tensor-parallel-size 1 \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.9 \
  --trust-remote-code \
  --dtype auto \
  --disable-log-requests &
VLLM_PID=$!
echo "vLLM PID: $VLLM_PID"

# Wait for server to start
echo "Waiting for model to load (max 10 minutes)..."
MODEL_READY=0
for i in $(seq 1 60); do
  sleep 10
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$VLLM_PORT/health 2>/dev/null || echo "000")
  echo "  Attempt $i/60 - Health: $HEALTH"
  if [ "$HEALTH" = "200" ]; then
    echo "Model ready after $((i * 10)) seconds!"
    MODEL_READY=1
    break
  fi
  if ! kill -0 $VLLM_PID 2>/dev/null; then
    echo "ERROR: vLLM process died!"
    break
  fi
done

if [ "$MODEL_READY" -ne 1 ]; then
  echo "ERROR: Model failed to load within timeout"
  echo "=== vLLM Process Status ==="
  ps aux | grep -E "vllm" | grep -v grep
  wait $VLLM_PID 2>/dev/null
  exit 1
fi

# Health check
echo "=== Health Check ==="
curl -s http://localhost:$VLLM_PORT/health
echo ""

# List models
echo "=== Models ==="
curl -s http://localhost:$VLLM_PORT/v1/models
echo ""

# Test query
echo "=== Test Query ==="
curl -s -X POST http://localhost:$VLLM_PORT/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${MODEL_NAME}\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello, who are you?\"}],\"max_tokens\":100}"
echo ""

echo "=== Server ready at http://$(hostname):$VLLM_PORT ==="
echo "=== Job finished at $(date) ==="
