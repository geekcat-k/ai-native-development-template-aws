import * as cdk from 'aws-cdk-lib';
import { customDomainFromEnv, StarterStack } from '../lib/starter-stack.js';

const app = new cdk.App();
// スタック名はCI側のSTACK_NAME変数と一致させる（既定: AiWebStarterStack）
new StarterStack(app, process.env.STACK_NAME || 'AiWebStarterStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // 独自ドメインはRepository variablesのCUSTOM_DOMAIN_NAME、HOSTED_ZONE_ID、CERTIFICATE_ARNで有効にする
  customDomain: customDomainFromEnv(process.env),
});
