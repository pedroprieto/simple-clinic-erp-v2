const qs = require("qs");
const axios = require("axios").default;

exports.handler = async function (event) {
  const redirectUri =
    "https://" +
    event["headers"]["Host"] +
    "/" +
    event["requestContext"]["stage"] +
    process.env.redirectUri;

  const appUri =
    "https://" +
    event["headers"]["Host"] +
    "/" +
    event["requestContext"]["stage"] +
    process.env.appUri;

  const code = event.queryStringParameters?.code;
  if (code == null) {
    return {
      statusCode: 400,
      body: "code query param required",
    };
  }
  const data = {
    grant_type: "authorization_code",
    client_id: process.env.cognitoAppClientId,
    redirect_uri: encodeURI(redirectUri),
    code: code,
  };
  const res = await axios.post(process.env.tokenUri, qs.stringify(data), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return {
    statusCode: 302,
    headers: {
      Location: appUri,
      "Set-Cookie": `accessToken=${res.data.access_token}; Secure; HttpOnly; SameSite=Lax; Path=/`,
    },
    isBase64Encoded: false,
  };
};
