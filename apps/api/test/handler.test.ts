import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { send = send; },
  GetItemCommand: class { constructor(public input: unknown) {} },
}));

import { handler } from '../src/handler.js';

describe('GET /api/hello', () => {
  beforeEach(() => {
    process.env.SAMPLE_TABLE_NAME = 'sample';
    send.mockReset();
  });

  it('DynamoDBのサンプルレコードを返す', async () => {
    send.mockResolvedValue({ Item: { message: { S: 'Hello from DynamoDB' } } });
    const response = await handler();
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body!)).toEqual({ message: 'Hello World', sample: 'Hello from DynamoDB' });
    expect(send).toHaveBeenCalledOnce();
  });

  it('DynamoDB障害をエラーとして返す', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    send.mockRejectedValue(new Error('unavailable'));
    const response = await handler();
    expect(response.statusCode).toBe(500);
    vi.restoreAllMocks();
  });
});
