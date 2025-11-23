#!/bin/sh
set -e

if [ "$1" = 'frankenphp' ] || [ "$1" = 'php' ] || [ "$1" = 'bin/console' ]; then

	if [ -z "${APP_SECRET:-}" ]; then
		APP_SECRET=$(php -r 'echo bin2hex(random_bytes(32));')
		export APP_SECRET
		echo "APP_SECRET not set - generated random secret"
	fi

	if [ -z "${JWT_SECRET:-}" ]; then
		JWT_SECRET=$(php -r 'echo bin2hex(random_bytes(64));')
		export JWT_SECRET
		echo "JWT_SECRET not set - generated random secret"
	fi

	if grep -q ^DATABASE_URL= .env; then
		echo 'Waiting for database to be ready...'

		# Configuration (overridable via env)
		DB_WAIT_ATTEMPTS=5
		DB_WAIT_SLEEP=1
		DB_WAIT_BACKOFF=2
		DB_WAIT_MAX_SLEEP=10

		ATTEMPT=1
		SLEEP_TIME="$DB_WAIT_SLEEP"
		DB_READY=0
		LAST_ERROR=""

		# Try until DB is reachable or attempts exhausted
		while [ "$ATTEMPT" -le "$DB_WAIT_ATTEMPTS" ]; do
			if php bin/console dbal:run-sql -q "SELECT 1" >/dev/null 2>&1; then
				DB_READY=1
				break
			fi

			# Capture verbose error for the last attempt only (to avoid noisy logs)
			if [ "$ATTEMPT" -eq "$DB_WAIT_ATTEMPTS" ]; then
				LAST_ERROR=$(php bin/console dbal:run-sql -q "SELECT 1" 2>&1 || true)
			fi

			echo "Still waiting for database to be ready... ($ATTEMPT/$DB_WAIT_ATTEMPTS). Next retry in ${SLEEP_TIME}s."
			sleep "$SLEEP_TIME"

			# Exponential backoff with cap
			if [ "$DB_WAIT_BACKOFF" -gt 1 ] 2>/dev/null; then
				NEXT=$((SLEEP_TIME * DB_WAIT_BACKOFF))
				if [ "$NEXT" -gt "$DB_WAIT_MAX_SLEEP" ]; then
					SLEEP_TIME="$DB_WAIT_MAX_SLEEP"
				else
					SLEEP_TIME="$NEXT"
				fi
			fi

			ATTEMPT=$((ATTEMPT + 1))
		done

		if [ "$DB_READY" -eq 1 ]; then
			echo '✔️  The database is now ready and reachable'
		else
			echo '⚠️  The database is not up or not reachable:'
			[ -n "$LAST_ERROR" ] && echo "   $LAST_ERROR"
			echo 'ℹ️  Continuing startup (migrations will be skipped)…'
		fi

		# Run migrations only if DB is ready and migrations exist
		if [ "$DB_READY" -eq 1 ] && [ "$(find ./migrations -iname '*.php' -print -quit)" ]; then
			echo '🔄 Running migrations…'
			set +e
			php bin/console doctrine:migrations:migrate --no-interaction --all-or-nothing
			RET=$?
			set -e
			if [ $RET -ne 0 ]; then
				echo "⚠️  Migrations exited with code $RET, but container will continue."
			else
				echo '✅ Migrations completed successfully.'
			fi
		fi
	fi
	echo 'setfacl'

	setfacl -R -m u:www-data:rwX -m u:"$(whoami)":rwX var
	setfacl -dR -m u:www-data:rwX -m u:"$(whoami)":rwX var

	echo 'PHP app ready!'
fi

exec docker-php-entrypoint "$@"
