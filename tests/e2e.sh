#!/usr/bin/env bash
set -euo pipefail

# Simple end-to-end tests script for Obsidiane Auth.
# It exercises the main flows:
# - initial admin setup (if needed)
# - login / me / refresh / logout
# - registration + email verification (manual step)
# - password reset (manual link)
# - admin invitation + invite completion (manual link)

BASE_URL="${BASE_URL:-http://localhost:8000}"

# Admin account used for tests
ADMIN_EMAIL="${ADMIN_EMAIL:-admin+e2e@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Secret123!}"

# Regular user for registration flow
REGISTER_EMAIL="${REGISTER_EMAIL:-user+e2e@example.com}"
REGISTER_PASSWORD="${REGISTER_PASSWORD:-Secret123!}"
REGISTER_DISPLAY_NAME="${REGISTER_DISPLAY_NAME:-E2E User}"

# User for invitation flow
INVITE_EMAIL="${INVITE_EMAIL:-invitee+e2e@example.com}"
INVITE_DISPLAY_NAME="${INVITE_DISPLAY_NAME:-Invited User}"
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

generate_csrf() {
  php -r 'echo bin2hex(random_bytes(16));'
}

step_initial_admin() {
  info "Checking if initial admin is needed..."

  # Try hitting /setup: if it redirects or returns 200, we can attempt setup
  http_code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/setup" || echo "000")

  if [[ "$http_code" != "200" ]]; then
    info "Initial admin page not available (http $http_code). Assuming admin already exists."
    return 0
  fi

  warn "Initial admin seems required. Creating admin: ${ADMIN_EMAIL}"

  csrf=$(generate_csrf)
  curl -s -i \
    -H 'Content-Type: application/json' \
    -H "csrf-token: ${csrf}" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\",\"displayName\":\"Admin E2E\"}" \
    "${BASE_URL}/api/setup/admin"
}

step_login_admin() {
  info "Logging in as admin: ${ADMIN_EMAIL}"
  csrf=$(generate_csrf)
  curl -s -i \
    -c "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "csrf-token: ${csrf}" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    "${BASE_URL}/api/login"
}

step_me_admin() {
  info "Fetching /api/auth/me as admin"
  curl -s -i -b "${ADMIN_COOKIES}" "${BASE_URL}/api/auth/me"
}

step_refresh_admin() {
  info "Refreshing admin token"
  curl -s -i -b "${ADMIN_COOKIES}" -X POST "${BASE_URL}/api/token/refresh"
}

step_logout_admin() {
  info "Logging out admin"
  csrf=$(generate_csrf)
  curl -s -i \
    -b "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "csrf-token: ${csrf}" \
    -X POST "${BASE_URL}/api/auth/logout"
}

step_register_user() {
  info "Registering user: ${REGISTER_EMAIL}"
  csrf=$(generate_csrf)
  curl -s -i \
    -H 'Content-Type: application/json' \
    -H "csrf-token: ${csrf}" \
    -d "{\"email\":\"${REGISTER_EMAIL}\",\"password\":\"${REGISTER_PASSWORD}\",\"displayName\":\"${REGISTER_DISPLAY_NAME}\"}" \
    "${BASE_URL}/api/auth/register"

  warn "An email with a verify link should have been sent for ${REGISTER_EMAIL}."
  warn "Open Maildev / Notifuse and click the /verify-email link, then press ENTER to continue."
  read -r _
}

step_password_reset_flow() {
  info "Requesting password reset for: ${REGISTER_EMAIL}"
  csrf=$(generate_csrf)
  curl -s -i \
    -H 'Content-Type: application/json' \
    -H "csrf-token: ${csrf}" \
    -d "{\"email\":\"${REGISTER_EMAIL}\"}" \
    "${BASE_URL}/reset-password"

  warn "A reset-password email should be available for ${REGISTER_EMAIL}."
  warn "Open Maildev / Notifuse, retrieve the reset link (/reset-password/reset/{token}), and test it manually in the browser."
  warn "Press ENTER to continue once done."
  read -r _
}

step_invite_user() {
  info "Inviting user: ${INVITE_EMAIL}"

  info "Logging in as admin again (for invite)..."
  step_login_admin

  csrf=$(generate_csrf)
  curl -s -i \
    -b "${ADMIN_COOKIES}" \
    -H 'Content-Type: application/json' \
    -H "csrf-token: ${csrf}" \
    -d "{\"email\":\"${INVITE_EMAIL}\"}" \
    "${BASE_URL}/api/auth/invite"

  warn "An invitation email should have been sent to ${INVITE_EMAIL}."
  warn "Open Maildev / Notifuse, click the /invite/complete?token=... link, et complétez l’invitation (nom + mot de passe)."
  warn "Utilisez par exemple displayName='${INVITE_DISPLAY_NAME}', password='${INVITE_PASSWORD}'."
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
  prompt_var "Register display name" REGISTER_DISPLAY_NAME

  info "Utilisateur pour le parcours d'invitation"
  prompt_var "Invite email" INVITE_EMAIL
  prompt_var "Invite display name" INVITE_DISPLAY_NAME
  prompt_password "Invite password" INVITE_PASSWORD

  info "Résumé de la configuration :"
  printf '  BASE_URL           = %s\n' "${BASE_URL}"
  printf '  ADMIN_EMAIL        = %s\n' "${ADMIN_EMAIL}"
  printf '  REGISTER_EMAIL     = %s\n' "${REGISTER_EMAIL}"
  printf '  REGISTER_DISPLAY   = %s\n' "${REGISTER_DISPLAY_NAME}"
  printf '  INVITE_EMAIL       = %s\n' "${INVITE_EMAIL}"
  printf '  INVITE_DISPLAY     = %s\n' "${INVITE_DISPLAY_NAME}"

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
  step_password_reset_flow
  step_invite_user
  info "E2E script finished."
}

main "$@"
