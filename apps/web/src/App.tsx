import { useEffect, useState } from 'react';

type HelloResponse = {
  message: string;
  sample?: string;
};

export function App() {
  const [apiMessage, setApiMessage] = useState('APIに接続しています…');

  useEffect(() => {
    let active = true;
    async function loadHello() {
      try {
        const configResponse = await fetch('/config.json');
        if (!configResponse.ok) throw new Error('設定を取得できませんでした');
        const config = (await configResponse.json()) as { apiBaseUrl: string };
        const apiResponse = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/hello`);
        if (!apiResponse.ok) throw new Error('APIに接続できませんでした');
        const result = (await apiResponse.json()) as HelloResponse;
        if (active) setApiMessage(result.sample ?? result.message);
      } catch (error) {
        if (active) setApiMessage(error instanceof Error ? error.message : '予期しないエラーが発生しました');
      }
    }
    void loadHello();
    return () => { active = false; };
  }, []);

  return (
    <main>
      <span className="eyebrow">AI Web App Starter</span>
      <h1>Hello World</h1>
      <p>React + AWS Lambda + DynamoDB の最小構成です。</p>
      <section aria-label="APIの応答">
        <strong>サンプルAPIの応答</strong>
        <p>{apiMessage}</p>
      </section>
    </main>
  );
}
