// Import putItemHandler function from put-item.mjs
import { handler } from "../../../src/handlers/postDoctor.mjs";
// Import dynamodb from aws-sdk
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
// This includes all tests for putItemHandler()
describe("Test putItemHandler", function () {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
  });

  // This test invokes putItemHandler() and compare the result
  it("Add doctor", async () => {
    const returnedItem = { PK: "id1", SK: "name1" };

    // Return the specified value whenever the spied put function is called
    ddbMock.on(PutCommand).resolves({
      returnedItem,
    });

    const event = {
      httpMethod: "POST",
      body: '{"template": {"data": [{"name": "nombre","value": "Pedro"}]}}',
    };

    // Invoke putItemHandler()
    const result = await handler(event);

    const expectedResult = {
      statusCode: 201,
      // body: JSON.stringify(returnedItem),
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});
