# やりたいこと
Amazon Cognito の User Poolの JSON ウェブトークン (JWT) を検証する。  
※ User Pool のみ使用。ID Pool は不要。

<br>
<br>
<br>
<br>
<br>

# JWTの取得
`get-id-token.ts`

Amazon Cognito の IDトークンは、JWTである ([Understanding the identity (ID) token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html))。
まずは、そのIDトークンを取得する。

### 参考
- [CognitoユーザーのIDトークンを取得するスクリプトを書いてみた（AWS SDK for JavaScript v3）](https://dev.classmethod.jp/articles/get-the-id-token-of-a-cognito-user-aws-sdk-for-javascript-v3/)
  - [SDK for JavaScript を使用した Amazon Cognito ID プロバイダーの例 (v3) / アクション / AdminInitiateAuth](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_cognito-identity-provider_code_examples.html#actions)
    - AWS SDK for JavaScript v3
      - [AdminInitiateAuthCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/command/AdminInitiateAuthCommand/)
      - [AdminInitiateAuthCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminInitiateAuthCommandInput/)

## Cognito User Pool
Cognitoにおいて、GUIでのユーザー作成は、「パスワードを強制的に変更」ステータスから「確認済み」への変更が面倒くさいため、AWS CLIからユーザーを作成する。
```shell
# ユーザーを作成
aws cognito-idp admin-create-user --user-pool-id "[COGNITO_USER_POOL_ID]" --username "[COGNITO_USER_NAME]" --user-attributes Name=email,Value="[COGNITO_USER_NAME]" Name=email_verified,Value=true --message-action SUPPRESS

# ユーザーのパスワードを変更
aws cognito-idp admin-set-user-password --user-pool-id "[COGNITO_USER_POOL_ID]" --username "[COGNITO_USER_NAME]" --password "[COGNITO_USER_PASSWORD]" --permanent
```

### 参考
- [AWS Cognitoで、AWS CLI でユーザを作りパスワードを設定してCONFIRMEDにする](https://zenn.dev/ytkhs/articles/efc0a777a73f15)
  - [aws.cognito-idp.admin-create-user](https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/admin-create-user.html)
    - [Amazon Cognito User Pools / API Reference / AdminCreateUser](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminCreateUser.html)
  - [aws.cognito-idp.admin-set-user-password](https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/admin-set-user-password.html)

- [[小ネタ] コンテナへAWS CLI v2をインストールする時にチョッとハマったこと](https://dev.classmethod.jp/articles/tips-for-aws-cli-v2-on-container/)
  - ~~pagerをそもそも消す方法：[AWS CLI使おうと思ったら、[Errno 2] No such file or directory: 'less'と言われた](https://zenn.dev/10inoino/articles/fb02beecfb7135)~~

## その他参考
- [AWS SDK for JavaScript, Version 3](https://docs.aws.amazon.com/sdk-for-javascript/)
  - [API Reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
  - [Amazon Cognito Identity Provider examples using SDK for JavaScript (v3)](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_cognito-identity-provider_code_examples.html)
- [【注意喚起】2024年7月9日からCognitoのM2M認証（Client Credentials）が有料になります](https://dev.classmethod.jp/articles/amazon-cognito-tiered-pricing-m2m-usage/)

<br>
<br>
<br>
<br>
<br>

# JWTの検証
## jsonwebtokenを使用
- [JWT認証の流れを理解する](https://qiita.com/asagohan2301/items/cef8bcb969fef9064a5c)
  - Amazon Cognito の JWT は、公開鍵方式 (秘密鍵で署名の作成、公開鍵で署名の検証) で署名されている。上記サイトIDプロバイダが、今回の場合は Amazon Cognito となる。
- [CognitoのJWTをNode.js(Typescript)で検証する方法](https://qiita.com/purini-to/items/075143f45fa0caf558d8)
  - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)でJWTの検証を行っている。
    - `jwt-verify` を使用。
  - [node-jwks-rsa](https://github.com/auth0/node-jwks-rsa)で、 JWT の kid を基に公開鍵を取得。
    - 公開鍵は、 Amazon Cognitoの `https://cognito-idp.<Region>.amazonaws.com/<userPoolId>/.well-known/jwks.json` (参考：[Verifying a JSON Web Token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)) から取得できる。

- [Verifying a JSON Web Token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)では、以下の検証を要求している。
  1. トークンは、有効期限切れではない
      - `jwt-verify` は、デフォルトで有効期限切れか否かの確認をしてくれる（参考：[node-jsonwebtokeの検証処理についての流れを確認する](https://zenn.dev/maronn/articles/about-verify-in-node-jsonwebtoken)）。
        - option に `ignoreExpiration` の設定がわざわざある。
  2. IDトークンに含まれる aud クレームは、 App Client Id と一致している
    - option の `audience` に、Cognito の App Client Id を設定することで、 aud の検証を追加できる。
  3. IDトークンに含まれる issur クレーム (iss) は、 User Pool (`https://cognito-idp.<region>.amazonaws.com/<userpoolID>`) と一致している
    - option の `issure` に、Cognito の User Pool を設定することで、 issure の検証を追加できる。
  4. token_use クレームの確認 (IDトークンのみを使用する場合、IDトークンの token_use クレームが id になっている)
    - IDトークンのデコード結果は、 payload であり、その中に token_use があるので、チェックする。

## AWS JWT Verifyを使用
- [AWS JWT Verify](https://github.com/awslabs/aws-jwt-verify?tab=readme-ov-file)
  - [Amazon Cognito JSON ウェブトークンの署名を復号して検証するにはどうすればよいですか?](https://repost.aws/ja/knowledge-center/decode-verify-cognito-json-token)
  - [Verifying a JSON Web Token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)で検証を要求している項目が、全てデフォルトで入っている。

<br>
<br>
<br>
<br>
<br>

# その他参考
- [[Node.js / TypeScript] Amazon CognitoのJWTをデコードする、JWTを作成してテストする](https://dev.classmethod.jp/articles/nodejs-typescript-decode-a-jwt-of-amazon-cognito-create-a-jwt-for-testing/)
  - jwt-decodeでJWTのデコードを行っている。JWTの検証はしていない。
