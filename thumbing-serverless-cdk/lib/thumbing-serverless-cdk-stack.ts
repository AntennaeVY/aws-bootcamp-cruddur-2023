import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

// Load env vars
require("dotenv").config();

export class ThumbingServerlessCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName: string = process.env.THUMBING_BUCKET_NAME as string;
    const topicName: string = process.env.THUMBING_TOPINC_NAME as string;
    const webhookUrl: string = process.env.THUMBING_WEBHOOK_URL as string;
    const functionPath: string = process.env.THUMBING_FUNCTION_PATH as string;
    const folderInput: string = process.env.THUMBING_S3_FOLDER_INPUT as string;
    const folderOutput: string = process.env.THUMBING_S3_FOLDER_OUTPUT as string;

    const bucket = this.createBucket(bucketName);
    const lambdaFunction = this.createLambda(functionPath, bucketName, folderInput, folderOutput);

    const snsTopic = this.createSnsTopic(topicName);
    
    this.createS3NotifyToLambda(folderInput, lambdaFunction, bucket);
    this.createS3NotifyToSns(folderOutput,snsTopic,bucket);
    this.createSnsSubscription(snsTopic,webhookUrl)
    
    const s3ReadWritePolicy = this.createPolicyBucketAccess(bucket.bucketArn)
    const snsPublishPolicy = this.createPolicySnSPublish(snsTopic.topicArn)

    lambdaFunction.addToRolePolicy(s3ReadWritePolicy);
    lambdaFunction.addToRolePolicy(snsPublishPolicy);
  }
  
  createBucket(bucketName: string): s3.IBucket {
    const bucket = new s3.Bucket(this, "ThumbingBucket", {
      bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    return bucket;
  }

  createLambda(functionPath: string, bucketName: string, folderInput: string, folderOutput: string): lambda.IFunction {
    const lambdaFunction = new lambda.Function(this, 'ThumbLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(functionPath),
      environment: {
        DEST_BUCKET_NAME: bucketName,
        FOLDER_INPUT: folderInput,
        FOLDER_OUTPUT: folderOutput,
        PROCESS_WIDTH: '512',
        PROCESS_HEIGHT: '512'
      }
    });

    return lambdaFunction;
  }
  
  createS3NotifyToLambda(prefix: string, lambdaFunction: lambda.IFunction, bucket: s3.IBucket): void {
    const destination = new s3n.LambdaDestination(lambdaFunction);
    
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      destination,
      {prefix: prefix}
    )
  }

  createPolicyBucketAccess(bucketArn: string){
    const s3ReadWritePolicy = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        `${bucketArn}/*`,
      ]
    });
    return s3ReadWritePolicy;
  }

  createSnsTopic(topicName: string): sns.ITopic{
    const logicalName = "Topic";
    const snsTopic = new sns.Topic(this, logicalName, {
      topicName: topicName
    });
    return snsTopic;
  }

  createS3NotifyToSns(prefix: string, snsTopic: sns.ITopic, bucket: s3.IBucket): void {
    const destination = new s3n.SnsDestination(snsTopic)
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT, 
      destination,
      {prefix: prefix}
    );
  }

  createSnsSubscription(snsTopic: sns.ITopic, webhookUrl: string): sns.Subscription {
    const snsSubscription = snsTopic.addSubscription(
      new subscriptions.UrlSubscription(webhookUrl)
    )
    return snsSubscription;
  }

  createPolicySnSPublish(topicArn: string){
    const snsPublishPolicy = new iam.PolicyStatement({
      actions: [
        'sns:Publish',
      ],
      resources: [
        topicArn
      ]
    });
    return snsPublishPolicy;
  }
}
