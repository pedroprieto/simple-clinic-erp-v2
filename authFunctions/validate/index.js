const { CognitoJwtVerifier } = require("aws-jwt-verify");

function getAccessTokenFromCookies(cookieStr) {
  const cookieArr = cookieStr.split("accessToken=");
  if (cookieArr[1] != null) {
    return cookieArr[1];
  }

  return null;
}

var generatePolicy = function (principalId, groups, effect, resource) {
  var authResponse = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    var statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  // Cognito groups
  if (groups) {
    authResponse.context = {
      groups: groups.join(","),
    };
  }
  return authResponse;
};

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.userPoolId,
  tokenUse: "access",
  clientId: process.env.cognitoAppClientId,
});

exports.handler = async (event) => {
  if (event.headers.Cookie == null) {
    console.log("No cookies found");
    return generatePolicy("", [], "Deny", event.methodArn);
  }

  const accessToken = getAccessTokenFromCookies(event.headers.Cookie);
  if (accessToken == null) {
    console.log("Access token not found in cookies");

    return generatePolicy("", [], "Deny", event.methodArn);
  }
  try {
    let tokenInfo = await verifier.verify(accessToken);
    return generatePolicy(
      tokenInfo.username,
      tokenInfo["cognito:groups"],
      "Allow",
      event.methodArn,
    );
  } catch (e) {
    console.error(e);
    return generatePolicy("", [], "Deny", event.methodArn);
  }
};
