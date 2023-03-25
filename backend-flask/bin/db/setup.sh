#!/bin/bash -e

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="setting things up..."
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

db_env="dev"

if [ "$1" = "prod" ]; then
    db_env="prod"
fi

bin_path="$(realpath .)/bin/db"

source "$bin_path/drop.sh" "$db_env" 
source "$bin_path/create.sh" "$db_env"
source "$bin_path/schema_load.sh" "$db_env"
source "$bin_path/seed.sh" "$db_env"
