import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';

// 独自ドメインで公開する場合の設定。ホストゾーンと証明書は利用者が事前に用意する
export interface CustomDomainProps {
  readonly domainName: string;
  readonly hostedZoneId: string;
  // CloudFrontで使うため、us-east-1で発行したACM証明書のARNを指定する
  readonly certificateArn: string;
}

export interface StarterStackProps extends cdk.StackProps {
  readonly customDomain?: CustomDomainProps;
}

// 環境変数の3項目がすべて空なら独自ドメインなし、一部だけ設定されていればエラーにする
export function customDomainFromEnv(env: NodeJS.ProcessEnv): CustomDomainProps | undefined {
  const domainName = env.CUSTOM_DOMAIN_NAME?.trim() || '';
  const hostedZoneId = env.HOSTED_ZONE_ID?.trim() || '';
  const certificateArn = env.CERTIFICATE_ARN?.trim() || '';
  const values = [domainName, hostedZoneId, certificateArn];
  if (values.every((value) => value === '')) return undefined;
  if (values.some((value) => value === '')) {
    throw new Error('独自ドメインを使う場合は CUSTOM_DOMAIN_NAME、HOSTED_ZONE_ID、CERTIFICATE_ARN をすべて設定してください。');
  }
  return { domainName, hostedZoneId, certificateArn };
}

function validateCustomDomain({ domainName, certificateArn }: CustomDomainProps): void {
  if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domainName)) {
    throw new Error(`CUSTOM_DOMAIN_NAME は小文字のドメイン名（例: app.example.com）で指定してください: ${domainName}`);
  }
  if (!certificateArn.startsWith('arn:aws:acm:us-east-1:')) {
    throw new Error('CERTIFICATE_ARN には us-east-1（バージニア北部）で発行したACM証明書のARNを指定してください。');
  }
}

export class StarterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StarterStackProps) {
    super(scope, id, props);

    const customDomain = props?.customDomain;
    if (customDomain) validateCustomDomain(customDomain);

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const sampleTable = new dynamodb.Table(this, 'SampleTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const helloFunction = new lambdaNodejs.NodejsFunction(this, 'HelloFunction', {
      logGroup: new logs.LogGroup(this, 'HelloFunctionLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }),
      entry: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/api/src/handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_24_X,
      environment: { SAMPLE_TABLE_NAME: sampleTable.tableName },
      bundling: { externalModules: [] },
    });
    sampleTable.grant(helloFunction, 'dynamodb:GetItem');

    // 認証なしの公開APIなので、既定ステージにスロットリングを設定する
    const api = new apigateway.HttpApi(this, 'HttpApi', { createDefaultStage: false });
    new apigateway.HttpStage(this, 'DefaultStage', {
      httpApi: api,
      autoDeploy: true,
      throttle: { rateLimit: 10, burstLimit: 20 },
    });
    api.addRoutes({
      path: '/api/hello',
      methods: [apigateway.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('HelloIntegration', helloFunction),
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      ...(customDomain && {
        domainNames: [customDomain.domainName],
        certificate: acm.Certificate.fromCertificateArn(this, 'SiteCertificate', customDomain.certificateArn),
      }),
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new origins.HttpOrigin(`${api.apiId}.execute-api.${this.region}.${this.urlSuffix}`),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    });

    if (customDomain) {
      const zone = route53.HostedZone.fromHostedZoneId(this, 'HostedZone', customDomain.hostedZoneId);
      const target = route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution));
      // 末尾にドットを付けて完全修飾名で指定し、ホストゾーン名の入力を不要にする
      const recordName = `${customDomain.domainName}.`;
      new route53.ARecord(this, 'SiteAliasRecord', { zone, recordName, target });
      new route53.AaaaRecord(this, 'SiteAliasRecordIpv6', { zone, recordName, target });
    }

    new cdk.CfnOutput(this, 'SiteBucketName', { value: siteBucket.bucketName });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${customDomain ? customDomain.domainName : distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, 'CloudFrontUrl', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'SampleTableName', { value: sampleTable.tableName });
  }
}
