SHELL := /bin/bash

OPENAPI_URL ?= http://localhost:8000/api/docs.json
OPENAPI_SPEC ?= openapi.json

MERIDIANE_VERSION ?= 2.*.*
MERIDIANE_FORMATS ?= application/ld+json
MERIDIANE_MAJOR := $(firstword $(subst ., ,$(MERIDIANE_VERSION)))
MERIDIANE_PRESET_ARG :=
MERIDIANE_FORMATS_ARG :=

ifeq ($(MERIDIANE_MAJOR),1)
  MERIDIANE_PRESET_ARG := --preset=native
else
  MERIDIANE_FORMATS_ARG := --formats "$(MERIDIANE_FORMATS)"
endif
LIB_NAME ?= bridge
NPM_PACKAGE_NAME ?= bridge
APP_VERSION ?= 0.0.0-dev

FRONTEND_DIR ?= webfront
FRONTEND_BRIDGE_DIR ?= $(FRONTEND_DIR)/bridge
DIST_DIR ?= dist

.PHONY: bridge bridge-openapi bridge-build bridge-install bridge-clean

bridge: bridge-openapi bridge-build bridge-install

bridge-openapi:
	echo "🔄 Fetch OpenAPI spec from $(OPENAPI_URL)"
	curl --retry 10 --retry-delay 2 --retry-connrefused \
		--fail-with-body \
		--write-out "\n→ HTTP_CODE=%{http_code}\n" \
		"$(OPENAPI_URL)" \
		-o "$(OPENAPI_SPEC)"

bridge-build:
	echo "🏗️  Build $(NPM_PACKAGE_NAME) ($(APP_VERSION))"
	npx -y @obsidiane/meridiane@$(MERIDIANE_VERSION) build "$(NPM_PACKAGE_NAME)" \
		--version "$(APP_VERSION)" \
		--spec "$(OPENAPI_SPEC)" \
		$(MERIDIANE_FORMATS_ARG) \
		$(MERIDIANE_PRESET_ARG)

bridge-install:
	test -d "$(DIST_DIR)/$(LIB_NAME)" || { echo "Missing $(DIST_DIR)/$(LIB_NAME). Run 'make bridge-build' first."; exit 1; }
	echo "📦 Copy to $(FRONTEND_BRIDGE_DIR)"
	rm -rf "$(FRONTEND_BRIDGE_DIR)"
	mkdir -p "$(FRONTEND_BRIDGE_DIR)"
	cp -R "$(DIST_DIR)/$(LIB_NAME)/." "$(FRONTEND_BRIDGE_DIR)/"

bridge-clean:
	rm -rf "$(DIST_DIR)/$(LIB_NAME)" "$(OPENAPI_SPEC)" "$(FRONTEND_BRIDGE_DIR)"
