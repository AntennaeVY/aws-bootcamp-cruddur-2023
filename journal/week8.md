# Week 8 — Serverless Image Processing

In this week's session, we'll be setting up a serverless image processing project using AWS CDK. We'll be using TypeScript as our language of choice.

## New Directory
To begin, let's create a new top-level directory for our CDK pipeline:

```sh

cd /workspace/aws-bootcamp-cruddur-2023
mkdir thumbing-serverless-cdk
```

## Install CDK globally
We need to install the AWS CDK CLI globally so that we can use it from anywhere in our system:

```sh

npm install aws-cdk -g
```

We'll also add the installation command to our Gitpod task file:

```yaml

  - name: cdk
    before: |
      npm install aws-cdk -g
```
## Initialize a new project
Next, we'll initialize a new CDK project within the directory we created earlier:

```sh

cdk init app --language typescript
```

## Add an S3 Bucket
We'll now add the code for creating an S3 bucket to our thumbing-serverless-cdk-stack.ts file:

```ts

import * as s3 from 'aws-cdk-lib/aws-s3';

const bucketName: string = process.env.THUMBING_BUCKET_NAME as string;

const bucket = new s3.Bucket(this, 'ThumbingBucket', {
  bucketName: bucketName,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

We'll also need to set the environment variable for our bucket name:

```sh

export THUMBING_BUCKET_NAME="cruddur-thumbs"
gp env THUMBING_BUCKET_NAME="cruddur-thumbs"
```

Here are some helpful links for the Bucket construct and Removal Policy:

[Bucket Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html)
[Removal Policy](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_core.RemovalPolicy.html)

## Bootstrapping
Before we proceed, we need to bootstrap our CDK project:

Deploying stacks with the AWS CDK requires dedicated Amazon S3 buckets and other containers to be available to AWS CloudFormation during deployment.

```sh

cdk bootstrap "aws://$AWS_ACCOUNT_ID/$AWS_DEFAULT_REGION"
```

## Build
We can use the build command to catch errors before runtime. This command will build our TypeScript code:

```sh

npm run build
```

## Synth
The synth command is used to synthesize the AWS CloudFormation stack(s) that represent our infrastructure as code:

```sh

cdk synth
```

## Deploy
With our code synthesized, we can now deploy it to AWS:

```sh

cdk deploy
```

## List Stacks
We can list the currently deployed stacks by running the following command:

```sh

cdk ls
```

## Load Environment Variables
We'll now load the environment variables we need for our project:

```ts

const dotenv = require('dotenv');
dotenv.config();

const bucketName: string = process.env.THUMBING_BUCKET_NAME as string;
const folderInput: string = process.env.THUMBING_S3_FOLDER_INPUT as string;
const folderOutput: string = process.env.THUMBING_S3_FOLDER_OUTPUT as string;
const webhookUrl: string = process.env.THUMBING_WEBHOOK_URL as string;
const topicName: string = process.env.THUMBING_TOPIC_NAME as string;
const functionPath: string = process.env.THUMBING_FUNCTION_PATH as string;
console.log('bucketName',bucketName)
console.log('folderInput',folderInput)
console.log('folderOutput',folderOutput)
console.log('webhookUrl',webhookUrl)
console.log('topicName',topicName)
console.log('functionPath',functionPath)
```

## Create Bucket
We'll create a function for creating an S3 bucket:

```ts

import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = this.createBucket(bucketName)

createBucket(bucketName: string): s3.IBucket {
  const logicalName: string = 'ThumbingBucket';
  const bucket = new s3.Bucket(this, logicalName , {
    bucketName: bucketName,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });
  return bucket;
}
```

## Create Lambda
We'll also create a function for creating a Lambda function:

```ts

import * as lambda from 'aws-cdk-lib/aws-lambda';

const lambda = this.createLambda(folderInput,folderOutput,functionPath,bucketName)

createLambda(folderIntput: string, folderOutput: string, functionPath: string, bucketName: string): lambda.IFunction {
  const logicalName = 'ThumbLambda';
  const code = lambda.Code.fromAsset(functionPath)
  const lambdaFunction = new lambda.Function(this, logicalName, {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: code,
    environment: {
      DEST_BUCKET_NAME: bucketName,
      FOLDER_INPUT: folderIntput,
      FOLDER_OUTPUT: folderOutput,
      PROCESS_WIDTH: '512',
      PROCESS_HEIGHT: '512'
    }
  });
  return lambdaFunction;
}
```

## Create SNS Topic
We'll create a function for creating an SNS topic:

```ts

import * as sns from 'aws-cdk-lib/aws-sns';

const snsTopic = this.createSnsTopic(topicName)

createSnsTopic(topicName: string): sns.ITopic{
  const logicalName = "Topic";
  const snsTopic = new sns.Topic(this, logicalName, {
    topicName: topicName
  });
  return snsTopic;
}
```


## Create S3 Event Notification to SNS
We'll create a function for creating an S3 event notification to SNS:

```ts
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

this.createS3NotifyToSns(folderOutput,snsTopic,bucket)

createS3NotifyToSns(prefix: string, snsTopic: sns.ITopic, bucket: s3.IBucket): void {
  const destination = new s3n.SnsDestination(snsTopic)
  bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED_PUT, 
    destination,
    {prefix: prefix}
  );
}
```

## Create S3 Event Notification to Lambda
We'll create a function for creating an S3 event notification to Lambda:

```ts
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

this.createS3NotifyToLambda(folderInput,lambda,bucket)

createS3NotifyToLambda(prefix: string, lambda: lambda.IFunction, bucket: s3.IBucket): void {
  const destination = new s3n.LambdaDestination(lambda);
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT,
    destination,
    {prefix: prefix}
  )
}
```

## Create Policy for Bucket Access
We'll create a function for creating a policy for bucket access:

```ts
const s3ReadWritePolicy = this.createPolicyBucketAccess(bucket.bucketArn)

createPolicyBucketAccess(bucketArn: string): iam.PolicyStatement {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['s3:GetObject', 's3:PutObject'],
    resources: [`${bucketArn}/*`]
  });
  return policyStatement;
}
```

## Create Policy for SNS Publishing
We'll create a function for creating a policy for SNS publishing:

```ts
const snsPublishPolicy = this.createPolicySnSPublish(snsTopic.topicArn)

createPolicySnSPublish(topicArn: string): iam.PolicyStatement {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['sns:Publish'],
    resources: [topicArn]
  });
  return policyStatement;
}
```
## Attach the Policies to the Lambda Role
We'll attach the policies to the lambda role:

```ts
lambda.addToRolePolicy(s3ReadWritePolicy);
lambda.addToRolePolicy(snsPublishPolicy);
```

# Conclusion
That's it for this week's session. We've set up the infrastructure for our serverless image processing project using AWS CDK.