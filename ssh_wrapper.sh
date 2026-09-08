#!/bin/bash
# Wrapper script to SSH into axisapps server using 'none' auth
# This bypasses ssh-mcp's credential requirements

HOST="ssh.axisapps.io"
USER="20743a74e43c44d089869826d0e979f3"
COMMAND="$1"

if [ -z "$COMMAND" ]; then
    echo "Usage: $0 <command>"
    exit 1
fi

# Use ssh with BatchMode=yes to handle 'none' auth
ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${USER}@${HOST}" "$COMMAND" 2>/dev/null
