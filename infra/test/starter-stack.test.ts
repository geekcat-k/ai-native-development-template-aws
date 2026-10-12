import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { StarterStack } from '../lib/starter-stack.js';

describe('StarterStack', () => {
  it('非公開S3、DynamoDB、Lambda、HTTP APIを作る', () => {
    const app = new cdk.App();
    const template = Template.fromStack(new StarterStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    }));

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    expect(Object.keys(template.findResources('AWS::Lambda::Function')).length).toBeGreaterThan(0);
  });

  it('APIをCloudFrontの/api配下に公開し、スロットリングとログ保持期間を設定する', () => {
    const app = new cdk.App();
    const template = Template.fromStack(new StarterStack(app, 'TestStack2', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    }));

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CacheBehaviors: [Match.objectLike({ PathPattern: 'api/*' })],
      },
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      DefaultRouteSettings: { ThrottlingRateLimit: 10, ThrottlingBurstLimit: 20 },
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 30 });
  });

  it('LambdaにはDynamoDBのGetItemだけを許可する', () => {
    const app = new cdk.App();
    const template = Template.fromStack(new StarterStack(app, 'TestStack3', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    }));

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [Match.objectLike({ Action: 'dynamodb:GetItem', Effect: 'Allow' })],
      },
    });
  });
});
