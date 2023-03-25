#!/bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="seeding database..."
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

seed_path="$(realpath .)/db/seed.sql"

if [ "$1" = "prod" ]; then
    URL=$CONNECTION_URL_PROD
else
    URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL_DEV")
fi

psql $URL cruddur < $seed_path