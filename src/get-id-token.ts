import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandInput,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";

export const getIdToken = async (): Promise<string> => {
  const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
  });

  const input: AdminInitiateAuthCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: process.env.COGNITO_USERNAME!,
      PASSWORD: process.env.COGNITO_PASSWORD!,
    }
  }

  const command = new AdminInitiateAuthCommand(input);

  const response = await client.send(command);
  return response.AuthenticationResult?.IdToken || "";
}
