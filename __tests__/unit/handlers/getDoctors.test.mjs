// Import getAllItemsHandler function from get-all-items.mjs
import { handler } from "../../../src/handlers/getDoctors.mjs";
// Import dynamodb from aws-sdk
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

// This includes all tests for getAllItemsHandler()
describe("Test getDoctors", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
  });

  it("should return ids", async () => {
    const items = [
      { PK: "id1", SK: "sk1" },
      { PK: "id2", SK: "sk2" },
    ];

    // Return the specified value whenever the spied scan function is called
    ddbMock.on(QueryCommand).resolves({
      Items: items,
    });

    const event = {
      httpMethod: "GET",
      requestContext: {
        domainName: "http://localhost",
      },
    };

    // Invoke helloFromLambdaHandler()
    const result = await handler(event);
    const data = JSON.parse(result.body);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(items),
    };

    // Compare the result with the expected result
    // expect(result).toEqual(expectedResult);
    expect(data.collection).toBeDefined();
    expect(data.collection.items).toHaveLength(2);
  });
});
