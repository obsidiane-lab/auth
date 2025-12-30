SHELL := /bin/bash

.PHONY: sdks sdks-clean bridge sdk-npm

# Generate both: Angular app bridge + npm SDK package
sdks: bridge sdk-npm
	echo "✅ Bridge and SDK generated successfully"

# Generate bridge for Angular app (webfront)
bridge:
	echo "🧩 Generating Bridge for webfront..."
	rm -rf webfront/bridge projects/
	npx -y @obsidiane/meridiane@2.*.* generate "@suretiq/bridge" \
		--version "0.0.0-dev" \
		--spec "http://localhost:9000/api/docs.json" \
		--formats "application/ld+json"
	mkdir -p webfront/bridge
	cp -r projects/bridge/src/* webfront/bridge/
	rm -rf projects/
	echo "✅ Bridge generated: webfront/bridge/"

# Generate SDK npm package (packages/auth-client-js)
sdk-npm:
	echo "📦 Generating SDK npm package..."
	rm -rf packages/auth-client-js/src projects/
	npx -y @obsidiane/meridiane@2.*.* generate "@obsidiane/auth-client-js" \
		--version "0.1.0" \
		--spec "http://localhost:9000/api/docs.json" \
		--formats "application/ld+json"
	mkdir -p packages/auth-client-js/src
	cp -r projects/auth-client-js/src/* packages/auth-client-js/src/
	rm -rf projects/
	echo "✅ SDK generated: packages/auth-client-js/src/"

# Clean up generated files
sdks-clean:
	echo "🧹 Cleaning generated files..."
	rm -rf webfront/bridge packages/auth-client-js/src
	echo "✅ Cleaned"
