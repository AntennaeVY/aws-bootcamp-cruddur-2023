# Week 5 — DynamoDB and Serverless Caching

## Pattern A (showing a single conversation)
To retrieve a list of messages that belong to a message group and are ordered by the created_at timestamp from newest to oldest (DESC), we can use the following SQL query:

```SQL
SELECT
  messages.uuid,
  messages.display_name,
  messages.message,
  messages.handle,
  messages.created_at -- sk
FROM messages
WHERE
  messages.message_group_uuid = {{message_group_uuid}} -- pk
ORDER BY messages.created_at DESC
```

Here, `message_group_uuid` is the primary key of the message group, which we retrieve from `Pattern B`.

## Pattern B (list of conversation)
To retrieve a list of previous conversations, we can use the following SQL query:

```SQL
SELECT
  message_groups.uuid,
  message_groups.other_user_uuid,
  message_groups.other_user_display_name,
  message_groups.other_user_handle,
  message_groups.last_message,
  message_groups.last_message_at
FROM message_groups
WHERE
  message_groups.user_uuid = {{user_uuid}} --pk
ORDER BY message_groups.last_message_at DESC
```

Here, `user_uuid` is the primary key of the user. This query returns the UUID, display name, handle, and the last message of the other user in the conversation, along with the timestamp of the last message.

To optimize this query, we can create a Global Secondary Index (GSI) on the `last_message_at` attribute. This will allow us to query the `message_groups` table using the `last_message_at` attribute as the primary key instead of the `user_uuid` attribute, which can improve query performance.

## Pattern C (create a message)

To create a new message and insert it into the messages table, we can use the following SQL query:

```SQL
INSERT INTO messages (
  user_uuid,
  display_name,
  handle,
  creaed_at
)
VALUES (
  {{user_uuid}},
  {{display_name}},
  {{handle}},
  {{created_at}}
);
```

Here, we insert the `user_uuid`, `display_name`, `handle`, and `created_at `attributes of the message into the messages table. The user_uuid attribute is the primary key of the user who creates the message, which we retrieve from `Pattern B`.

## Pattern D (update a message_group for the last message)

When a user creates a message, we need to update the conversation to display the last message information for the conversation.

We can use the following SQL query:

```sql
UPDATE message_groups
SET 
  other_user_uuid = {{other_user_uuid}}
  other_user_display_name = {{other_user_display_name}}
  other_user_handle = {{other_user_handle}}
  last_message = {{last_message}}
  last_message_at = {{last_message_at}}
WHERE 
  message_groups.uuid = {{message_group_uuid}}
  AND message_groups.user_uuid = {{user_uuid}}
```

Here, we update the `message_groups` table with the `other_user_uuid`, `other_user_display_name`, `other_user_handle`, `last_message`, and `last_message_at` attributes of the last message. We use the `message_group_uuid` and `user_uuid` attributes to identify the conversation that needs to be updated.

## DynamoDB Stream trigger to update message groups
To update the message groups table when a new message is added to the messages table, we can create a DynamoDB stream trigger for our Lambda function. We will follow these steps:

- Create a VPC endpoint for the DynamoDB service on your VPC.
- Create a Python Lambda function in your VPC.
- Enable streams on the messages table with 'new image' attributes included.
- Add your function as a trigger on the stream.
- Grant the Lambda IAM role permission to read the DynamoDB stream events.
- Grant the Lambda IAM role permission to update table items.


Python Lambda function that updates the message groups table when a new message is created:

```python
import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource(
 'dynamodb',
 region_name='ca-central-1',
 endpoint_url="http://dynamodb.ca-central-1.amazonaws.com"
)

def lambda_handler(event, context):
  pk = event['Records'][0]['dynamodb']['Keys']['pk']['S']
  sk = event['Records'][0]['dynamodb']['Keys']['sk']['S']
  if pk.startswith('MSG#'):
    group_uuid = pk.replace("MSG#","")
    message = event['Records'][0]['dynamodb']['NewImage']['message']['S']
    print("GRUP ===>",group_uuid,message)
    
    table_name = 'cruddur-messages'
    index_name = 'message-group-sk-index'
    table = dynamodb.Table(table_name)
    data = table.query(
      IndexName=index_name,
      KeyConditionExpression=Key('message_group_uuid').eq(group_uuid)
    )
    print("RESP ===>",data['Items'])
    
    # recreate the message group rows with new SK value
    for i in data['Items']:
      delete_item = table.delete_item(Key={'pk': i['pk'], 'sk': i['sk']})
      print("DELETE ===>",delete_item)
      
      response = table.put_item(
        Item={
          'pk': i['pk'],
          'sk': sk,
          'message_group_uuid':i['message_group_uuid'],
          'message':message,
          'user_display_name': i['user_display_name'],
          'user_handle': i['user_handle'],
          'user_uuid': i['user_uuid']
        }
      )
      print("CREATE ===>",response)
```

This function queries the messages table for the message group UUID, deletes the old message group rows, and creates new rows with the updated sk value and the new message. We can use the DynamoDB resource and `boto3` library to interact with the DynamoDB table. We also need to create an index on the `message_group_uuid` attribute and name it `message-group-sk-index`.


## Serverless Caching
We can use Momento CLI tool to create and manage serverless caching for our application. This tool allows us to create, manage, and delete caches with ease. We can also use it to generate access tokens and manage the TTL (Time To Live) of our caches.

#### Install the Momento CLI tool.
- Add the Momento step to your Gitpod workflow file.
- Login to Momento and generate an access token.
- Create a cache using the access token.

#### Installation

Install the Momento CLI tool by running `brew tap momentohq/tap` and `brew install momento-cli` in your terminal.

Add the Momento step to your Gitpod workflow file by adding the following code to your `gitpod.yml` file:
```yaml
  - name: momento
    before: |
      brew tap momentohq/tap
      brew install momento-cli
```

Login to Momento and generate an access token by running the momento account signup command with your email and region as arguments. You will receive an access token in the response.

Create a cache using the access token by running the following commands:

```bash
export MOMENTO_AUTH_TOKEN="<your-access-token>"
export MOMENTO_TTL_SECONDS="600"
export MOMENTO_CACHE_NAME="cruddur"
gp env MOMENTO_AUTH_TOKEN=""
gp env MOMENTO_TTL_SECONDS="600"
gp env MOMENTO_CACHE_NAME="cruddur"
```

You might need to run the momento configure command if your CLI tool does not pick up the environment variables.

Create the cache using the following command:
```bash
momento cache create --name cruddur
```

This will create a new cache named cruddur with a TTL of 600 seconds (10 minutes). You can now use the Momento CLI tool to interact with the cache and store serverless data.