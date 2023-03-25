#!/usr/bin/env python3

import boto3
import sys
import json
import os

current_path = os.path.dirname(os.path.abspath(__file__))
parent_path = os.path.abspath(os.path.join(current_path, '..', '..'))
sys.path.append(parent_path)

from lib.db import db

attrs = {
    'endpoint_url': 'http://localhost:8000'
}

if len(sys.argv) == 2:
    if "prod" in sys.argv[1]:
        attrs = {}

dynamodb_client = boto3.client('dynamodb', **attrs)
table_name = 'cruddur-messages'

def get_my_uuid():
    sql = """
    SELECT 
      users.uuid
    FROM users
    WHERE
      users.handle=%(handle)s
    """
    uuid = db.query_value(sql, {
        "handle": "andrewbrown"
    })

    return uuid

my_uuid = get_my_uuid()

query_params = {
    'TableName': table_name,
    'KeyConditionExpression': 'pk = :pk',
    'ExpressionAttributeValues': {
        ':pk': {'S': f"GRP#{my_uuid}"}
    },
    'ReturnConsumedCapacity': 'TOTAL'
}

response = dynamodb_client.query(**query_params)

print(json.dumps(response, sort_keys=True, indent=2))
