#!/bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="dropping database..."
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

if [ "$1" = "prod" ]; then
    URL=$(sed 's/\/cruddur$/\/postgres/g' <<<"$CONNECTION_URL_PROD")
else
    URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL_DEV")
fi

psql $URL -c "DROP DATABASE IF EXISTS cruddur;"