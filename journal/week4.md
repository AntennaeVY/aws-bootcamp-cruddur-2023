# Week 4 — Postgres and RDS

## Watched Ashish's Week 4 - Security Considerations

Watched the video tutorial by Ashish, which covered important security considerations for working with Postgres and AWS RDS.

## Create RDS Postgres Instance
- Created a new RDS Postgres instance in Amazon Web Services (AWS).
- Configured the instance to use the appropriate security settings.
- Set up the necessary database users and permissions.
- To create the necessary database for the Postgres instance, the  `createdb` command can be used. Here's the command:

```bash
$ createdb cruddur -h localhost -U postgres
```

Alternatively, the database can be created within the PSQL client using the following commands:

```bash
$ psql -U postgres -h localhost
```
```sql
CREATE database cruddur;
```
To check that the database has been successfully created, the `\l` command can be used in the PSQL client.

To delete the database, the following command can be used within the PSQL client:

`DROP database cruddur;`

## Create Schema for Postgres
 - Designed and created the necessary database schema for the Postgres instance.
 - Defined the tables, columns, and relationships to be used in the application.

To create the necessary database schema, we can use the following steps:

#### Import Script
Create a new SQL file called `schema.sql` and place it in     `backend-flask/db.`

Run the following command to import the schema:
```bash
$ psql cruddur < db/schema.sql -h localhost -U postgres
```
#### Add UUID Extension

We are going to have Postgres generate UUIDs. To enable this functionality, we need to use an extension called `uuid-ossp`.

Run the following command to create the extension:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
#### Create Tables

We need to create two tables: `users` and `activities`.

The users table can be created using the following command:

```sql
CREATE TABLE public.users (
  uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  display_name text,
  handle text
  cognito_user_id text,
  created_at TIMESTAMP default current_timestamp NOT NULL
);
```

The activities table can be created using the following command:
```sql
CREATE TABLE public.activities (
  uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message text NOT NULL,
  replies_count integer DEFAULT 0,
  reposts_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  reply_to_activity_uuid integer,
  expires_at TIMESTAMP,
  created_at TIMESTAMP default current_timestamp NOT NULL
);
```
#### Trigger for `updated_at` column

We want to automatically update the `updated_at` column whenever a row is updated in the users and activities tables.
To achieve this, we can create a function that updates the column whenever a row is updated.

Run the following command to create the function:

```sql
DROP FUNCTION IF EXISTS func_updated_at();
CREATE FUNCTION func_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Next, create the triggers to execute the function whenever a row is updated in the users and activities tables.

Run the following command to create the trigger for the users table:

```sql
CREATE TRIGGER trig_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE PROCEDURE func_updated_at();
Run the following command to create the trigger for the activities table:
CREATE TRIGGER trig_activities_updated_at 
BEFORE UPDATE ON activities 
FOR EACH ROW EXECUTE PROCEDURE func_updated_at();
To drop the triggers, use the following command:
DROP TRIGGER IF EXISTS trig_users_updated_at ON users;
DROP TRIGGER IF EXISTS trig_activities_updated_at ON activities;
```

### Bash scripting for common database actions
To automate common database tasks, we created a set of Bash scripts for tasks such as creating and dropping databases and tables, and inserting and retrieving data.

#### Shell Script to Connect to DB
We can create a new directory called bin to hold all our Bash scripts:

```bash
mkdir /workspace/aws-bootcamp-cruddur-2023/backend-flask/bin
```

We then create a new Bash script called `bin/db-connect` with the following content:

```bash
#!/usr/bin/env bash
psql $CONNECTION_URL
```

Make the script executable with the following command:

```bash
chmod u+x bin/db-connect
```
To execute the script, use the following command:

```bash
./bin/db-connect
```

#### Shell script to drop the database

Create a new Bash script called `bin/db-drop` with the following content:

```bash
#!/usr/bin/env bash
NO_DB_CONNECTION_URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL")
psql $NO_DB_CONNECTION_URL -c "DROP DATABASE IF EXISTS cruddur;"
```

To execute the script, use the following command:
```bash
./bin/db-drop
```

#### Shell script to create the database
Create a new Bash script called `bin/db-create` with the following content:

```bash
#!/usr/bin/bash
NO_DB_CONNECTION_URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL")
createdb cruddur $NO_DB_CONNECTION_URL
```

To execute the script, use the following command:
```bash
./bin/db-create
```

#### Shell script to load the schema
Create a new Bash script called `bin/db-schema-load` with the following content:

```bash
#!/usr/bin/bash
schema_path="$(realpath .)/db/schema.sql"
echo $schema_path
NO_DB_CONNECTION_URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL")
psql $NO_DB_CONNECTION_URL cruddur < $schema_path
```

To execute the script, use the following command:

```bash
./bin/db-schema-load
```

#### Shell script to load the seed data
Create a new Bash script called `bin/db-seed` with the following content:

```bash
#!/usr/bin/bash
echo "Loading seed data..."
NO_DB_CONNECTION_URL=$(sed 's/\/cruddur//g' <<<"$CONNECTION_URL")
psql $NO_DB_CONNECTION_URL cruddur < db/seed.sql
```

To execute the script, use the following command:

```bash
./bin/db-seed
```

#### Shell script to easily set up (reset) everything for our database
Create a new Bash script called `bin/db-setup` with the following content:

```bash
#!/usr/bin/bash
set -e # stop if it fails at any point
echo "Setting up the database..."
bin_path="$(realpath .)/bin"
source "$bin_path/db-drop"
source "$bin_path/db-create"
source "$bin_path/db-schema-load"
source "$bin_path/db-seed"
```

To execute the script, use the following command:

```bash
./bin/db-setup
```

#### Make prints nicer
To make prints for our shell scripts coloured, we can use the following code:

```bash
CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-script-label"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"
```

This will display text in cyan colour.

## Install Postgres driver in backend application

Installed the necessary Postgres driver in the backend application, which allows the application to communicate with the Postgres instance in AWS.

## Install Postgres Client
Set the env var for our `backend-flask` application as follows:

```yaml
backend-flask:
  environment:
    CONNECTION_URL: "${CONNECTION_URL}"
```

Add the following to our `requirements.txt`:
```python
psycopg[binary]
psycopg[pool]
```

Then, install the requirements using the following command:

```bash
$ pip install -r requirements.txt
```

#### DB Object and Connection Pool
Create a new file called `lib/db.py` with the following content:

```py
from psycopg_pool import ConnectionPool
import os


def query_wrap_object(template):
    sql = '''
    (SELECT COALESCE(row_to_json(object_row),'{}'::json) FROM (
    {template}
    ) object_row);
    '''
    return sql


def query_wrap_array(template):
    sql = '''
    (SELECT COALESCE(array_to_json(array_agg(row_to_json(array_row))),'[]'::json) FROM (
    {template}
    ) array_row);
    '''
    return sql


connection_url = os.getenv("CONNECTION_URL")
pool = ConnectionPool(connection_url)
```

#### Provision RDS Instance
To create an RDS instance, use the following command:

```bash
aws rds create-db-instance \
  --db-instance-identifier cruddur-db-instance \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version  14.6 \
  --master-username root \
  --master-user-password huEE33z2Qvl383 \
  --allocated-storage 20 \
  --availability-zone ca-central-1a \
  --backup-retention-period 0 \
  --port 5432 \
  --no-multi-az \
  --db-name cruddur \
  --storage-type gp2 \
  --publicly-accessible \
  --storage-encrypted \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --no-deletion-protection
```

This process may take around 10-15 minutes.

To temporarily stop an RDS instance for 4 days when we are not using it, use the following command:

```bash
aws rds stop-db-instance --db-instance-identifier cruddur-db-instance --db-instance-class db.t3.micro --no-skip-final-snapshot --final-db-snapshot-identifier cruddur-db-instance-snapshot --force-failover --no-delete-automated-backups
```

## Connect Gitpod to RDS instance

Configured Gitpod, the cloud-based development environment, to connect to the AWS RDS Postgres instance.

Set up the necessary security group rules to allow inbound traffic from Gitpod.

To connect to the RDS instance, we need to provide our Gitpod IP and whitelist inbound traffic on port 5432.

#### Get the Gitpod IP using the following command:

```bash
GITPOD_IP=$(curl ifconfig.me)
```

#### Create an inbound rule for Postgres (5432) and provide the Gitpod ID:

```bash
export DB_SG_ID="sg-0b725ebab7e25635e"
gp env DB_SG_ID="sg-0b725ebab7e25635e"
export DB_SG_RULE_ID="sgr-070061bba156cfa88"
gp env DB_SG_RULE_ID="sgr-070061bba156cfa88"
```

To update security groups, use the following command:

```bash
aws ec2 modify-security-group-rules \
    --group-id $DB_SG_ID \
    --security-group-rules "SecurityGroupRuleId=$DB_SG_RULE_ID,SecurityGroupRule={IpProtocol=tcp,FromPort=5432,ToPort=5432,CidrIpv4=$GITPOD_IP/32}"
```

To test remote access, create a connection URL:

```bash
export CONNECTION_URL="postgresql://root:huEE33z2Qvl383@cruddur-db-instance.czz1cuvepklc.ca-central-1.rds.amazonaws.com:5432/cruddur"
```

To update the URL for production use case, use the following command:

```bash
export PROD_CONNECTION_URL="postgresql://root:huEE33z2Qvl383@cruddur-db-instance.czz1cuvepklc.ca-central-1.rds.amazonaws.com:5432/cruddur"
gp env PROD_CONNECTION_URL="postgresql://root:huEE33z2Qvl383@cruddur-db-instance.czz1cuvepklc.ca-central-1.rds.amazonaws.com:5432/cruddur"
```

## Create AWS Cognito trigger to insert user into database

Configured AWS Cognito, the user authentication and authorization service, to trigger a database insert whenever a new user is added to the system.

#### Setup Cognito Post-Confirmation Lambda
To setup a Cognito Post-Confirmation Lambda, follow the steps below:

Create the handler function in Python 3.8:
```python
import json
import psycopg2
import os

def lambda_handler(event, context):
    user = event['request']['userAttributes']
    try:
        conn = psycopg2.connect(
            host=(os.getenv('PG_HOSTNAME')),
            database=(os.getenv('PG_DATABASE')),
            user=(os.getenv('PG_USERNAME')),
            password=(os.getenv('PG_SECRET'))
        )
        cur = conn.cursor()
        cur.execute("INSERT INTO users (display_name, handle, cognito_user_id) VALUES(%s, %s, %s)", (user['name'], user['email'], user['sub']))
        conn.commit() 

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        
    finally:
        if conn is not None:
            cur.close()
            conn.close()
            print('Database connection closed.')

    return event
```

Add a layer for psycopg2 with one of the below methods for development or production:

##### Development
Precompiled version of psycopg2 layer (easiest method)

ARN reference: 
`arn:aws:lambda:ca-central-1:898466741470:layer:psycopg2-py38:1`

Alternatively, create your own development layer by downloading the psycopg2-binary source files from https://pypi.org/project/psycopg2-binary/#files

##### Production: 
Follow the instructions on https://github.com/AbhimanyuHK/aws-psycopg2 to compile your own layer from postgres source libraries for the desired version.

#### Set the environment variables needed for the Lambda environment:

```bash
PG_HOSTNAME='cruddur-db-instance.czz1cuvepklc.ca-central-1.rds.amazonaws.com'
PG_DATABASE='cruddur'
PG_USERNAME='root'
PG_PASSWORD='huEE33z2Qvl383'
```

#### Add the function to Cognito:
Under the user pool properties, add the function as a Post Confirmation lambda trigger.