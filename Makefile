.PHONY: help install dev serve test integration-tests lint format gateway-install gateway-start gateway-stop

help:
	@echo 'Targets:'
	@echo '  install             Sync runtime dependencies with uv'
	@echo '  dev                 Sync project + dev dependencies with uv'
	@echo '  serve               Start the local LangGraph dev server'
	@echo '  test                Run unit tests'
	@echo '  integration-tests   Run integration tests'
	@echo '  lint                Run Ruff checks'
	@echo '  format              Format with Ruff'
	@echo '  gateway-install     Install OpenShell CLI (requires curl)'
	@echo '  gateway-start       Start OpenShell gateway (requires Docker/Podman)'
	@echo '  gateway-stop        Stop OpenShell gateway'

install:
	uv sync --no-dev

dev:
	uv sync

serve:
	uv run langgraph dev

test:
	uv run python -m pytest tests/unit_tests -q

integration-tests:
	uv run python -m pytest tests/integration_tests -q

lint:
	uv run python -m ruff check src tests

format:
	uv run python -m ruff format src tests

gateway-install:
	@echo "Installing OpenShell CLI..."
	curl -LsSf https://raw.githubusercontent.com/NVIDIA/OpenShell/main/install.sh | sh
	@echo "Installation complete. Run 'make gateway-start' to start the gateway."

gateway-start:
	@echo "Starting OpenShell gateway (requires Docker or Podman)..."
	openshell gateway start
	@echo "Gateway started. Agent will now use sandboxed execution."

gateway-stop:
	@echo "Stopping OpenShell gateway..."
	-pkill openshell-gateway 2>/dev/null || true
	@echo "Gateway stopped."
