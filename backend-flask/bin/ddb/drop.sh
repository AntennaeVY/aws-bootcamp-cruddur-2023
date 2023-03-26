#! /usr/bin/bash -e

if [ -z "$1" ]; then
  echo "No TABLE_NAME argument supplied e.g. bin/rds/describe-table cruddur-messages"
  exit 1
fi

TABLE_NAME=$1

if [ "$2" = "prod" ]; then
  ENDPOINT_URL=""
else
  ENDPOINT_URL="--endpoint-url=http://localhost:8000"
fi

aws dynamodb delete-table  $ENDPOINT_URL \
  --table-name $TABLE_NAME