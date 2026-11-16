import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { customDomainFromEnv, StarterStack } from '../lib/starter-stack.js';

const testEnv = { account: '123456789012', region: 'ap-northeast-1' };
const customDomain = {
  domainName: 'app.example.com',
  hostedZoneId: 'Z0123456789ABCDEFGHIJ',
  certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/11111111-2222-3333-4444-555555555555',
};

// スタックの合成はLambdaのバンドルを含むため1回数秒かかる。テストごとに合成すると、テストが増えたときに
// CIのverifyが長くなる。独自ドメインなしの標準の設定は1回だけ合成して共有する。
// テストはテンプレートを読むだけで変更しないこと。別の設定が必要なテストは個別に合成する。
let defaultTemplate: Template | undefined;

function synthesizeDefaultStack(): Template {
  defaultTemplate ??= Template.fromStack(new StarterStack(new cdk.App(), 'TestStack', { env: testEnv }));
  return defaultTemplate;
}

describe('StarterStack', () => {
  it('非公開S3、DynamoDB、Lambda、HTTP APIを作る', () => {
    const template = synthesizeDefaultStack();

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
    const template = synthesizeDefaultStack();

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
    const template = synthesizeDefaultStack();

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [Match.objectLike({ Action: 'dynamodb:GetItem', Effect: 'Allow' })],
      },
    });
  });

  it('独自ドメインを指定しない場合はCloudFrontの既定ドメインだけで公開する', () => {
    const template = synthesizeDefaultStack();

    template.resourceCountIs('AWS::Route53::RecordSet', 0);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: { Aliases: Match.absent(), ViewerCertificate: Match.absent() },
    });
  });

  it('独自ドメインを指定するとCloudFrontに証明書を設定し、Route 53にエイリアスを作る', () => {
    const app = new cdk.App();
    const template = Template.fromStack(new StarterStack(app, 'TestStack5', { env: testEnv, customDomain }));

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['app.example.com'],
        ViewerCertificate: Match.objectLike({
          AcmCertificateArn: customDomain.certificateArn,
          SslSupportMethod: 'sni-only',
        }),
      },
    });
    for (const type of ['A', 'AAAA']) {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'app.example.com.',
        Type: type,
        HostedZoneId: customDomain.hostedZoneId,
        AliasTarget: Match.objectLike({ HostedZoneId: Match.anyValue() }),
      });
    }
    template.hasOutput('SiteUrl', { Value: 'https://app.example.com' });
  });

  it('us-east-1以外の証明書や不正なドメイン名はエラーにする', () => {
    const app = new cdk.App();
    expect(() => new StarterStack(app, 'TestStack6', {
      env: testEnv,
      customDomain: { ...customDomain, certificateArn: customDomain.certificateArn.replace('us-east-1', 'ap-northeast-1') },
    })).toThrow(/us-east-1/);
    expect(() => new StarterStack(app, 'TestStack7', {
      env: testEnv,
      customDomain: { ...customDomain, domainName: 'https://App.example.com' },
    })).toThrow(/CUSTOM_DOMAIN_NAME/);
  });
});

describe('customDomainFromEnv', () => {
  it('3項目がすべて空なら独自ドメインなし、すべて設定されていれば値を返す', () => {
    expect(customDomainFromEnv({})).toBeUndefined();
    expect(customDomainFromEnv({ CUSTOM_DOMAIN_NAME: '', HOSTED_ZONE_ID: '', CERTIFICATE_ARN: '' })).toBeUndefined();
    expect(customDomainFromEnv({
      CUSTOM_DOMAIN_NAME: customDomain.domainName,
      HOSTED_ZONE_ID: customDomain.hostedZoneId,
      CERTIFICATE_ARN: customDomain.certificateArn,
    })).toEqual(customDomain);
  });

  it('一部だけ設定されている場合はエラーにする', () => {
    expect(() => customDomainFromEnv({ CUSTOM_DOMAIN_NAME: customDomain.domainName })).toThrow(/すべて設定/);
  });
});
