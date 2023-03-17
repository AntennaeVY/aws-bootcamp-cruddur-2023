#!/bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="creating database..."
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

if [ "$1" = "prod" ]; then
    URL=$CONNECTION_URL_PROD
else
    URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL_DEV")
fi

psql $URL -c "create database cruddur;"