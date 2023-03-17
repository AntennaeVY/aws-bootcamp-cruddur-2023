#!/bin/bash -e

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="setting things up..."
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

db_env="dev"

if [ "$1" = "prod" ]; then
    db_env="prod"
fi

bin_path="$(realpath .)/bin"

source "$bin_path/db_drop.sh $db_env" 
source "$bin_path/db_create.sh $db_env"
source "$bin_path/db_schema_load.sh $db_env"
source "$bin_path/db_seed.sh $db_env"
