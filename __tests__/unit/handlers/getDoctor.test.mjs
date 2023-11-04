// Import getByIdHandler function from get-by-id.mjs
import { handler } from "../../../src/handlers/getDoctor.mjs";
// Import dynamodb from aws-sdk
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

// This includes all tests for getByIdHandler()
describe("Get doctor", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
  });

  // This test invokes getByIdHandler() and compare the result
  it("should get item by id", async () => {
    const item = { PK: "id1", SK: "sk1" };

    // Return the specified value whenever the spied get function is called
    ddbMock
      .on(GetCommand, {
        Key: { PK: "id1", SK: "MEDICO" },
      })
      .resolves({
        Item: item,
      });

    const event = {
      httpMethod: "GET",
      pathParameters: {
        id: "id1",
      },
      requestContext: {
        domainName: "http://localhost",
      },
    };

    // Invoke getByIdHandler()
    const result = await handler(event);
    const data = JSON.parse(result.body);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(item),
    };

    // Compare the result with the expected result
    // expect(result).toEqual(expectedResult);
    expect(data.collection).toBeDefined();
    expect(data.collection.items).toHaveLength(1);
  });
  it("should not get non existing item", async () => {
    const item = { PK: "id1", SK: "sk1" };

    // Return the specified value whenever the spied get function is called
    ddbMock
      .on(GetCommand, {
        Key: { PK: "id1", SK: "MEDICO" },
      })
      .resolves({
        Item: item,
      });

    const event = {
      httpMethod: "GET",
      pathParameters: {
        id: "id2",
      },
      requestContext: {
        domainName: "http://localhost",
      },
    };

    // Invoke getByIdHandler()
    const result = await handler(event);

    // const expectedResult = {
    //   statusCode: 400,
    //   // body: JSON.stringify(item),
    // };

    // Compare the result with the expected result
    expect(result.statusCode).toEqual(400);
  });
});
