#!/usr/bin/env python3
import boto3
import sys

attrs = {
    'endpoint_url': 'http://localhost:8000'
}

if len(sys.argv) == 2:
    if "prod" in sys.argv[1]:
        attrs = {}

dynamodb_client = boto3.client('dynamodb', **attrs)
table_name = 'cruddur-messages'

table_schema = {
    'AttributeDefinitions': [
        {
            'AttributeName': 'message_group_uuid',
            'AttributeType': 'S'
        }, {
            'AttributeName': 'pk',
            'AttributeType': 'S'
        }, {
            'AttributeName': 'sk',
            'AttributeType': 'S'
        }
    ],
    'KeySchema': [{
        'AttributeName': 'pk',
        'KeyType': 'HASH'
    }, {
        'AttributeName': 'sk',
        'KeyType': 'RANGE'
    }
    ],
    'BillingMode': 'PROVISIONED',
    'ProvisionedThroughput': {
        'ReadCapacityUnits': 5,
        'WriteCapacityUnits': 5
    },
    'GlobalSecondaryIndexes': [{
        'IndexName': 'message-group-sk-index',
        'KeySchema': [{
            'AttributeName': 'message_group_uuid',
            'KeyType': 'HASH'
        }, {
            'AttributeName': 'sk',
            'KeyType': 'RANGE'
        }],
        'Projection': {
            'ProjectionType': 'ALL'
        },
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        },
    }]
}

response = dynamodb_client.create_table(
    TableName=table_name,
    **table_schema
)

print(response)
