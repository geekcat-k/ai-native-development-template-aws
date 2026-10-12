# 04. API Design

このドキュメントは、API仕様を整理するためのテンプレートです。

## 前提

- 参照する基本設計: `docs/03-architecture.md`
- 対象リリース:
- 作成日:
- 最終更新日:

## API設計方針

-

## 共通仕様

### ベースURL

| 環境 | URL |
| --- | --- |
| Local |  |
| Staging |  |
| Production |  |

### 認証方式

-

### 共通ヘッダー

| ヘッダー | 必須 | 説明 |
| --- | --- | --- |
| Authorization |  |  |

### 共通エラーレスポンス

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## エンドポイント一覧

| ID | Method | Path | 概要 | 関連機能 |
| --- | --- | --- | --- | --- |
| API-001 | GET |  |  |  |

## エンドポイント詳細

### API-001: API名

#### 概要

-

#### 関連機能

-

#### Request

```http
GET /path HTTP/1.1
Authorization: Bearer <token>
```

#### Path Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
|  |  |  |  |

#### Query Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
|  |  |  |  |

#### Request Body

```json
{}
```

#### Response

```json
{}
```

#### Status Codes

| Status | 条件 |
| --- | --- |
| 200 |  |
| 400 |  |
| 401 |  |
| 403 |  |
| 404 |  |
| 500 |  |

#### バリデーション

-

#### 権限

-

#### ログ

-

#### テスト観点

-

## Webhook

| ID | 送信元 | Path | 用途 | 検証方法 |
| --- | --- | --- | --- | --- |
| WH-001 |  |  |  |  |

## 変更互換性

-

## 確定事項

-

## 仮定

-

## 未決定事項

-

## 確認したい事項

-

## 承認ゲート

- [ ] 必要なAPIが機能要件と対応している
- [ ] 認証・認可が明確である
- [ ] エラー仕様が明確である
- [ ] テスト観点が明確である
- [ ] API設計を承認した
