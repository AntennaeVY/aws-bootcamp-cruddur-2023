#!/bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="psql active sessions"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

if [ "$1" = "prod" ]; then
    URL=$CONNECTION_URL_PROD
else
    URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL_DEV")
fi

psql $URL -c \
    "select pid as process_id, \
            usename as user,  \
            datname as db, \
            client_addr, \
            application_name as app,\
            state \
    from pg_stat_activity;"