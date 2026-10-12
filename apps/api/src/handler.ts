import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const client = new DynamoDBClient({});

export async function handler(): Promise<APIGatewayProxyStructuredResultV2> {
  const tableName = process.env.SAMPLE_TABLE_NAME;
  if (!tableName) {
    return { statusCode: 500, body: JSON.stringify({ message: 'テーブル設定がありません' }) };
  }

  try {
    const result = await client.send(new GetItemCommand({
      TableName: tableName,
      Key: { id: { S: 'hello' } },
    }));
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        message: 'Hello World',
        sample: result.Item?.message?.S ?? 'Hello World',
      }),
    };
  } catch (error) {
    console.error('DynamoDBの読み取りに失敗しました', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'データを取得できませんでした' }) };
  }
}
