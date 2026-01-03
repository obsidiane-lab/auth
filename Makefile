SHELL := /bin/bash

.PHONY: bridge bridge-clean pre-push pre-push-webfront pre-push-core pre-push-full

# Generate bridge for Angular app (webfront)
bridge:
	echo "🧩 Generating Bridge for webfront..."
	npx -y @obsidiane/meridiane@2.*.* generate "@auth/bridge" \
		--version "0.0.0-dev" \
		--spec "http://localhost:8000/api/docs.json" \
		--formats "application/ld+json" \
		--out "webfront/bridge/"
	echo "✅ Bridge generated: frontend/bridge/"

# Clean up generated files
bridge-clean:
	echo "🧹 Cleaning generated files..."
	rm -rf frontend/bridge projects/
	echo "✅ Cleaned"

# Pre-push checks (fast)
pre-push: pre-push-webfront

pre-push-webfront:
	cd webfront && npm run lint
	cd webfront && npm run build

# Pre-push checks (full)
pre-push-full: pre-push-webfront pre-push-core

pre-push-core:
	cd core && vendor/bin/phpstan analyse -c phpstan.neon.dist
