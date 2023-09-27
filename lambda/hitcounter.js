const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

// create AWS SDK clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const lambda = new LambdaClient();

exports.handler = async (event) => {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // update dynamo entry for "path" with hits++
    const command = new UpdateCommand({
        TableName: process.env.HITS_TABLE_NAME,
        Key: { path: event.path },
        UpdateExpression: "SET hits = :incr",
        ExpressionAttributeValues: { ":incr": 1 },
    });

    await docClient.send(command);

    const invokeCommand = new InvokeCommand({
        FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify(event),
    });

    // call downstream function and capture response
    const resp = await lambda.send(invokeCommand);    

    console.log("downstream response:", JSON.stringify(resp, undefined, 2));

    // return response back to upstream caller
    return JSON.parse(Buffer.from(resp.Payload));
}