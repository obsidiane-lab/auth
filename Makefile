SHELL := /bin/bash

.PHONY: bridge bridge-clean clean build build-prod check check-prod lint test

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

# Clean dist folder
clean:
	echo "🧹 Cleaning dist folder..."
	rm -rf webfront/dist
	echo "✅ Dist folder cleaned"

# Lint only
lint:
	echo "🔍 Linting webfront..."
	cd webfront && npm run lint
	echo "✅ Lint passed"

# Build development
build:
	echo "🏗️  Building webfront (development)..."
	cd webfront && npm run build
	echo "✅ Build completed"

# Build production
build-prod: clean
	echo "🏗️  Building webfront (production)..."
	cd webfront && npm run build -- --configuration=production
	echo "✅ Production build completed"

# Quick checks (lint + build dev)
check:
	echo "🔍 Running quick checks..."
	cd webfront && npm run lint
	cd webfront && npm run build
	echo "✅ Quick checks passed"

# Full production checks (lint + build prod + phpstan)
check-prod: clean
	echo "🚀 Running FULL production checks..."
	echo ""
	echo "📦 Step 1/3: Linting webfront..."
	cd webfront && npm run lint
	echo ""
	echo "🏗️  Step 2/3: Building webfront (production)..."
	cd webfront && npm run build -- --configuration=production
	echo ""
	echo "🔍 Step 3/3: Analyzing core with PHPStan..."
	cd core && vendor/bin/phpstan analyse -c phpstan.neon.dist
	echo ""
	echo "✅ ALL CHECKS PASSED - Ready to push! 🎉"

# Alias for check-prod
test: check-prod
