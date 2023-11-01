import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { v4 as uuidv4 } from 'uuid';

exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // TODO - switch case event.httpmethod to perform add/remove basket 
    // and checkout basket operations with using ddbClient object

    // GET /basket +
    // POST /basket +
    // GET /basket/{userName} +
    // DELETE /basket/{userName} +
    // POST /basket/checkout +

    let body;

    try {
      switch (event.httpMethod) {
        case "GET":
          if (event.pathParameters != null) {
            //body = await getBasket(event.pathParameters.userName); // GET /basket/{userName}
            console.log("Calling get ....");
            console.log(event.pathParameters.id);
            body = await getBasket(event.pathParameters.id); // GET basket/{id}
            } else {
            body = await getAllBaskets(); // GET /basket
          }
          break;
        case "POST":
          if (event.path == "/basket/checkout") {
            body = await checkoutBasket(event); // POST /basket/checkout
          } else {
              body = await createBasket(event); // POST /basket
          }
          break;
        case "PUT":
            body = await updateProduct(event); // PUT /product/{id}
        break;
        case "DELETE":
          // body = await deleteBasket(event.pathParameters.userName); // DELETE /basket/{userName}
          body = await deleteBasket(event.pathParameters.id); // DELETE /basket/{id}
          break;
        default:
          throw new Error(`Unsupported route: "${event.httpMethod}"`);
      }

      console.log(body);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Adjust as needed
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST,GET,PUT,DELETE',
        },
        body: JSON.stringify({
          message: `Successfully finished operation: "${event.httpMethod}"`,
          body: body
        })
      };

    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to perform operation.",
          errorMsg: e.message,
          errorStack: e.stack,
        })
      };
    }
};

const getBasket = async (orderId) => {
  console.log("getBasket");
  try {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        //Key: marshall({ userName: userName })
        Key: marshall({ id: orderId })
      };
   
      const { Item } = await ddbClient.send(new GetItemCommand(params));
  
      console.log(Item);
      return (Item) ? unmarshall(Item) : {};
  
    } catch(e) {
      console.error(e);
      throw e;
  }
}

const getAllBaskets = async () => {
  console.log("getAllBaskets");
  try {
    const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME, 
    //IndexName: 'createdDate', // Replace with the name of your GSI
     // KeyConditionExpression: 'id = :value',
     // ExpressionAttributeValues: {
     //   ':value': 'id', // Replace with your actual partition key value
     // },
      ScanIndexForward: false, // Set to false to sort in descending order (newest to oldest)
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);   

    // Sort the items by 'createdDate' attribute in descending order
    if (Items && Items.length > 0) {
      Items.sort((a, b) => b.createdDate.S - a.createdDate.S);
    }
   

    console.log(Items);
    
    return (Items) ? Items.map((item) => unmarshall(item)) : {}; 

    //return Items ? Items.map((item) => unmarshall(item)) : [];

  } catch(e) {
      console.error(e);
      throw e;
  }
}

const createBasket = async (event) => {
  console.log(`createBasket function. event : "${event}"`);
  try {
    const requestBody = JSON.parse(event.body);
    // set orderId
    const orderId = uuidv4();
    requestBody.id = orderId;
    // Get the current date and time using moment.js
    const moment = require('moment');
    const currentDateAndTime = moment().format('DD-MM-YYYY HH:mm:ss');
    requestBody.createdDate = currentDateAndTime;
    // Status : Not Confirmed ( when the new order is created )
    requestBody.status = 'NC';

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(requestBody || {})
    };  

    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log(createResult);
    return createResult;

  } catch(e) {
    console.error(e);
    throw e;
  }
}

const deleteBasket = async (orderId) => {
  console.log(`deleteBasket function. userName : "${orderId}"`);
  try {    
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: marshall({ id: orderId }),
    };   

    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
    console.log(deleteResult);
    return deleteResult;

  } catch(e) {
    console.error(e);
    throw e;
  }   
}


const updateProduct = async (event) => {
  console.log(`updateOrder Status. event : "${event}"`);
  try {
    const requestBody = JSON.parse(event.body);
    const objKeys = Object.keys(requestBody);
    console.log(`updateProduct function. requestBody : "${requestBody}", objKeys: "${objKeys}"`);   
    // Get the current date and time using moment.js
    //const moment = require('moment');
    //const currentDateAndTime = moment().format('DD-MM-YYYY HH:mm:ss');    
    //requestBody.modifiedDate = currentDateAndTime;
   
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: event.pathParameters.id }),
      UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
      }), {}),
      ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
          ...acc,
          [`:value${index}`]: requestBody[key],
      }), {})),
    };

    const updateResult = await ddbClient.send(new UpdateItemCommand(params));

    console.log(updateResult);
    return updateResult;
  } catch(e) {
    console.error(e);
    throw e;
  }

}

const checkoutBasket = async (event) => {
  console.log("checkoutBasket");
  // implement function   

  // publish an event to eventbridge - this will subscribe by order microservice 
    // and start ordering process.

}