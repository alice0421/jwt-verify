import { getIdToken } from "./get-id-token";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const jwtVerify = async(): Promise<void> => {
  const idToken = await getIdToken();

  // Verifier that expects valid id tokens:
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID as string,
    tokenUse: "id", // id | access
    clientId: process.env.COGNITO_CLIENT_ID as string,
  });

  try {
    const payload = await verifier.verify(
      idToken // the JWT as string
    );
    console.log("Token is valid. Payload:", payload);
  } catch {
    console.log("Token not valid!");
  }
}

jwtVerify();
