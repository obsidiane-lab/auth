#!/usr/bin/env bash
set -euo pipefail

# Simple end-to-end tests script for Obsidiane Auth.
# It exercises the main flows:
# - initial admin setup (if needed)
# - login / me / refresh / logout
# - registration + email verification (manual step)
# - password reset (manual link)
# - admin invitation + invite completion (manual link)
# - admin role update on a user

BASE_URL="${BASE_URL:-http://localhost:8001}"
# Origin used for Origin/Referer validation (defaults to BASE_URL).
ORIGIN="${ORIGIN:-$BASE_URL}"

# Admin account used for tests
ADMIN_EMAIL="${ADMIN_EMAIL:-admin+e2e@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Secret123!}"

# Regular user for registration flow
REGISTER_EMAIL="${REGISTER_EMAIL:-user+e2e@example.com}"
REGISTER_PASSWORD="${REGISTER_PASSWORD:-Secret123!}"

# User for invitation flow
INVITE_EMAIL="${INVITE_EMAIL:-invitee+e2e@example.com}"
INVITE_PASSWORD="${INVITE_PASSWORD:-Secret123!}"

# Output files
ADMIN_COOKIES="${ADMIN_COOKIES:-admin_cookies_e2e.txt}"
INVITEE_COOKIES="${INVITEE_COOKIES:-invitee_cookies_e2e.txt}"

info() {
  printf '\n\033[1;34m[INFO]\033[0m %s\n' "$*"
}

warn() {
  printf '\n\033[1;33m[WARN]\033[0m %s\n' "$*"
}

err() {
  printf '\n\033[1;31m[ERROR]\033[0m %s\n' "$*"
}

prompt_var() {
  local label="$1"
  local varname="$2"
  local current="${!varname:-}"

  if [[ -t 0 ]]; then
    read -rp "${label} [${current}]: " input || input=""
    if [[ -n "${input}" ]]; then
      printf -v "${varname}" '%s' "${input}"
    fi
  fi
}

prompt_password() {
  local label="$1"
  local varname="$2"
  local current="${!varname:-}"

  if [[ -t 0 ]]; then
    # Show only placeholder if a value exists
    local display="(current hidden)"
    if [[ -z "${current}" ]]; then
      display=""
    fi
    read -srp "${label} ${display}: " input || input=""
    printf '\n'
    if [[ -n "${input}" ]]; then
      printf -v "${varname}" '%s' "${input}"
    fi
  fi
}

step_initial_admin() {
  info "Ensuring initial admin exists..."
  body_file="$(mktemp)"
  http_code=$(curl -s -o "${body_file}" -w '%{http_code}' \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    "${BASE_URL}/api/setup/admin")

  if [[ "$http_code" == "201" ]]; then
    info "Initial admin created."
  elif [[ "$http_code" == "409" ]]; then
    info "Initial admin already exists."
  else
    warn "Initial admin setup returned HTTP ${http_code}."
    cat "${body_file}"
  fi
  rm -f "${body_file}"
}

step_login_admin() {
  info "Logging in as admin: ${ADMIN_EMAIL}"
  curl -s -i \
    -c "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    "${BASE_URL}/api/auth/login"
}

step_me_admin() {
  info "Fetching /api/auth/me as admin"
  curl -s -i -b "${ADMIN_COOKIES}" "${BASE_URL}/api/auth/me"
}

step_refresh_admin() {
  info "Refreshing admin token"
  curl -s -i -b "${ADMIN_COOKIES}" -H "Origin: ${ORIGIN}" -X POST "${BASE_URL}/api/auth/refresh"
}

step_logout_admin() {
  info "Logging out admin"
  curl -s -i \
    -b "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -X POST "${BASE_URL}/api/auth/logout"
}

step_register_user() {
  info "Registering user: ${REGISTER_EMAIL}"
  curl -s -i \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -d "{\"email\":\"${REGISTER_EMAIL}\",\"password\":\"${REGISTER_PASSWORD}\"}" \
    "${BASE_URL}/api/auth/register"

  warn "An email with a verify link should have been sent for ${REGISTER_EMAIL}."
  warn "Open Maildev / Notifuse and click the /verify-email link, then press ENTER to continue."
  read -r _
}

step_password_reset_flow() {
  info "Requesting password reset for: ${REGISTER_EMAIL}"
  curl -s -i \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -d "{\"email\":\"${REGISTER_EMAIL}\"}" \
    "${BASE_URL}/api/auth/password/forgot"

  warn "A reset-password email should be available for ${REGISTER_EMAIL}."
  warn "Open Maildev / Notifuse, retrieve the reset link (/reset-password/confirm?token=...), and test it manually in the browser."
  warn "Press ENTER to continue once done."
  read -r _
}

step_update_user_roles() {
  info "Updating roles for ${REGISTER_EMAIL} to ROLE_ADMIN (admin-only endpoint)"

  info "Logging in as admin for role update..."
  step_login_admin

  info "Fetching /api/users to resolve user id for ${REGISTER_EMAIL}"
  users_payload=$(curl -s -b "${ADMIN_COOKIES}" "${BASE_URL}/api/users")

  TARGET_EMAIL="${REGISTER_EMAIL}" user_id=$(
    python - <<'PY'
import json, os, re, sys

email = os.environ.get('TARGET_EMAIL', '').lower()

try:
    data = json.loads(sys.stdin.read())
except Exception:
    sys.exit(0)

user_id = None
for item in data.get('member', []):
    if str(item.get('email', '')).lower() == email:
        raw_id = item.get('id') or item.get('@id')
        if isinstance(raw_id, int):
            user_id = str(raw_id)
        elif isinstance(raw_id, str):
            match = re.search(r'/(\d+)(?:/)?$', raw_id)
            if match:
                user_id = match.group(1)
        break

if user_id:
    print(user_id)
PY
<<< "${users_payload}"
  )

  if [[ -z "${user_id:-}" ]]; then
    warn "User ${REGISTER_EMAIL} not found in /api/users; skipping role update."
    return 0
  fi

  info "POST /api/users/${user_id}/roles with ROLE_ADMIN"
  curl -s -i \
    -b "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -d '{"roles":["ROLE_ADMIN"]}' \
    "${BASE_URL}/api/users/${user_id}/roles"

  info "GET /api/users/${user_id} to verify roles"
  curl -s -i -b "${ADMIN_COOKIES}" "${BASE_URL}/api/users/${user_id}"
}

step_invite_user() {
  info "Inviting user: ${INVITE_EMAIL}"

  info "Logging in as admin again (for invite)..."
  step_login_admin

  curl -s -i \
    -b "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "Origin: ${ORIGIN}" \
    -d "{\"email\":\"${INVITE_EMAIL}\"}" \
    "${BASE_URL}/api/auth/invite"

  warn "An invitation email should have been sent to ${INVITE_EMAIL}."
  warn "Open Maildev / Notifuse, click the /invite/complete?token=... link, et complétez l’invitation (mot de passe)."
  warn "Utilisez par exemple password='${INVITE_PASSWORD}'."
  warn "Ensuite, testez le login de l’invité avec le SDK / UI. Appuyez sur ENTER quand vous avez terminé."
  read -r _
}

configure_interactive() {
  info "Configuration interactive des tests E2E"

  prompt_var "Base URL" BASE_URL

  info "Admin utilisé pour les tests"
  prompt_var "Admin email" ADMIN_EMAIL
  prompt_password "Admin password" ADMIN_PASSWORD

  info "Utilisateur pour le parcours d'inscription"
  prompt_var "Register email" REGISTER_EMAIL
  prompt_password "Register password" REGISTER_PASSWORD

  info "Utilisateur pour le parcours d'invitation"
  prompt_var "Invite email" INVITE_EMAIL
  prompt_password "Invite password" INVITE_PASSWORD

  info "Résumé de la configuration :"
  printf '  BASE_URL           = %s\n' "${BASE_URL}"
  printf '  ADMIN_EMAIL        = %s\n' "${ADMIN_EMAIL}"
  printf '  REGISTER_EMAIL     = %s\n' "${REGISTER_EMAIL}"
  printf '  INVITE_EMAIL       = %s\n' "${INVITE_EMAIL}"

  if [[ -t 0 ]]; then
    read -rp "Continuer avec ces paramètres ? [ENTER pour oui / Ctrl+C pour annuler] " _ || true
  fi
}

main() {
  if [[ -t 0 ]]; then
    configure_interactive
  else
    info "Mode non interactif (stdin n'est pas un TTY), utilisation des variables actuelles."
  fi

  info "E2E tests starting against BASE_URL=${BASE_URL}"
  step_initial_admin
  step_login_admin
  step_me_admin
  step_refresh_admin
  step_logout_admin
  step_register_user
  step_update_user_roles
  step_password_reset_flow
  step_invite_user
  info "E2E script finished."
}

main "$@"
