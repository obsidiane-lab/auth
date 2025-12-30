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
NPM_PACKAGE_NAME ?= @suretiq/bridge
LIB_NAME ?= $(notdir $(NPM_PACKAGE_NAME))
APP_VERSION ?= 0.0.0-dev

FRONTEND_DIR ?= webfront
FRONTEND_BRIDGE_DIR ?= $(FRONTEND_DIR)/bridge
DIST_DIR ?= dist

.PHONY: bridge bridge-openapi bridge-generate bridge-clean

bridge: bridge-openapi bridge-generate

bridge-openapi:
	echo "🔄 Fetch OpenAPI spec from $(OPENAPI_URL)"
	curl --retry 10 --retry-delay 2 --retry-connrefused \
		--fail-with-body \
		--write-out "\n→ HTTP_CODE=%{http_code}\n" \
		"$(OPENAPI_URL)" \
		-o "$(OPENAPI_SPEC)"

bridge-generate:
	echo "🧩 Generate $(NPM_PACKAGE_NAME) ($(APP_VERSION))"
	rm -rf "$(FRONTEND_BRIDGE_DIR)"
	mkdir -p "$(FRONTEND_BRIDGE_DIR)"
	npx -y @obsidiane/meridiane@$(MERIDIANE_VERSION) generate "$(NPM_PACKAGE_NAME)" \
		--version "$(APP_VERSION)" \
		--spec "$(OPENAPI_SPEC)" \
		--out "$(FRONTEND_BRIDGE_DIR)" \
		$(MERIDIANE_FORMATS_ARG) \
		$(MERIDIANE_PRESET_ARG)

bridge-clean:
	rm -rf "$(DIST_DIR)/$(LIB_NAME)" "$(OPENAPI_SPEC)" "$(FRONTEND_BRIDGE_DIR)"
