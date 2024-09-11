import { getIdToken } from "./get-id-token";
import jwt, { type JwtHeader, type SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const jwtVerify = async(): Promise<void> => {
  const client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  });

  const idToken = await getIdToken();
  // console.log(`IdToken: ${idToken}\n`);

  const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) throw err;
      if (key) {
        const publicJwk: string = key.getPublicKey();
        callback(null, publicJwk);
      } else {
        throw new Error("No key");
      }
    });
  }

  jwt.verify(
    idToken,
    getKey,
    {
      audience: process.env.COGNITO_CLIENT_ID,
      issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    },
    (err, decoded) => {
      if (err) throw err;
      if (decoded === undefined) throw new Error("Decoded result is undefined.");

      if (typeof decoded === "string") {
        console.log(decoded);
      } else {
        if (decoded.token_use === "id") {
          console.log(decoded);
        } else {
          throw new Error("'token_use' claim is not 'id'.");
        }
      }
    }
  );
}

jwtVerify();
