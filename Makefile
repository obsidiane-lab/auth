SHELL := /bin/bash

.PHONY: bridge bridge-clean

bridge:
	rm -rf webfront/bridge projects/
	npx -y @obsidiane/meridiane@2.*.* generate "@suretiq/bridge" \
		--version "0.0.0-dev" \
		--spec "http://localhost:9000/api/docs.json" \
		--formats "application/ld+json"
	cp -r projects/bridge webfront/
	rm -rf projects/

bridge-clean:
	rm -rf webfront/bridge
