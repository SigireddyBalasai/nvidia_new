# SSH AxisApps & NVIDIA NIM Discovery

## SSH Connection

- Host: `ssh.axisapps.io`
- User: `20743a74e43c44d089869826d0e979f3`
- Auth: Autologin (none required), but ssh-mcp uses key-based auth
- SSH key: `~/.ssh/id_ed25519_mcp`
- Login node: `slogin01` (Ubuntu 24.04)

## Cluster Architecture

| Host | IP | Role |
|------|-----|------|
| curiosity-v2 | 10.187.9.6 | Master/CM server |
| slogin01 | 10.187.9.53 | Login node (current) |
| k8-cont | 10.187.9.54 | Kubernetes control |
| k8-etc | 10.187.9.55 | Kubernetes etc |
| nfs-home | 10.187.9.56 | NFS home storage |
| ood-harbor | 10.187.9.52 | OnDemand dashboard |
| dgx01-dgx10 | 10.187.9.21-30 | NVIDIA DGX GPU nodes |

## Slurm Setup

- Module: `module load slurm` (from `/etc/profile`)
- srun path: `/cm/local/apps/slurm/current/bin/srun`
- Slurm version: 25.05.8
- Partition: `hackathon` (30 day limit), `maint` (8 hour limit)

### Node Status (as of 2026-09-08)

| Node | State |
|------|-------|
| dgx01 | drain |
| dgx02-03 | mix |
| dgx04-10 | idle (available) |

## MCP Config

### ssh-mcp server
- Package: `ssh-mcp` (npm, v2.8.0)
- Config: `~/.config/ssh-mcp/config.toml`
- OpenCode entry: `ssh-axisapps`

### Tools available via ssh-mcp
- `run-command` - execute arbitrary shell commands
- `read-command` - read-only commands (allowlisted)
- `open-session` / `close-session` - interactive sessions
- `sftp-upload` / `sftp-download` - file transfer
- `list-connections` - show configured profiles

## NIM Qwen3.8-27B

- Image: `nvcr.io/nim/qwen/qwen3.8-27b:2.1.1-variant`
- Backend: SGLang-based serving
- API: OpenAI-compatible (`/v1/chat/completions`)
- Default port: 8000
- Thinking enabled by default (`reasoning_effort: xhigh`)
- Disable thinking: `"chat_template_kwargs": {"enable_thinking": false}`
- Lower reasoning: `"reasoning_effort": "low"` or `"medium"`

### Docker run command (for compute node)
```bash
docker run --rm \
  --gpus all \
  --shm-size=16GB \
  -e NGC_API_KEY="$NGC_API_KEY" \
  -v "$LOCAL_NIM_CACHE:/opt/nim/.cache" \
  -p 8000:8000 \
  nvcr.io/nim/qwen/qwen3.8-27b:2.1.1-variant
```

### Test query
```bash
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen/qwen3.8-27b",
    "messages": [{"role": "user", "content": "Hello, who are you?"}],
    "reasoning_effort": "low"
  }'
```

## Next Steps

1. Restart OpenCode to load ssh-axisapps MCP
2. Use `run-command` to SSH into login node
3. `module load slurm`
4. `srun --partition=hackathon --gres=gpu:1 --nodelist=dgx04 bash`
5. Pull and run NIM container
6. Test query
