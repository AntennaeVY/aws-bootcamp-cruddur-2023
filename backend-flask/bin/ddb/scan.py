#!/usr/bin/env python3

import boto3

attrs = {
    'endpoint_url': 'http://localhost:8000'
}

dynamodb_resource = boto3.resource('dynamodb', **attrs)
table_name = 'cruddur-messages'

table = dynamodb_resource.Table(table_name)
response = table.scan()
items = response['Items']
for item in items:
    print(item)
