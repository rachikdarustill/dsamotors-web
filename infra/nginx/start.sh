#!/bin/sh
set -eu

CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

if [ -f "$CERT_PATH" ]; then
  TEMPLATE="/etc/nginx/templates/https.conf.template"
else
  TEMPLATE="/etc/nginx/templates/http.conf.template"
fi

envsubst '$DOMAIN' < "$TEMPLATE" > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
