import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";

exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // TODO - switch case event.httpmethod to perform add/remove basket 
  // and checkout basket operations with using ddbClient object

  // GET /basket +
  // POST /basket +
  // GET /basket/{userName} +
  // DELETE /basket/{userName} +
  // POST /basket/checkout +

  var body;
  var pbody;

  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters != null) {
          body = await getMarket(event.pathParameters.id); // GET /market/{id}
          } else {
          body = await getAllMarkets(); // GET /market
        }
        break;
      case "POST":      
        const requestBody = JSON.parse(event.body);   
        console.log(requestBody.id);
        console.log(requestBody.publish);

        if (requestBody.id != null) {
          if(requestBody.publish) {
            body = await createMarket(event); // POST /market/{id}            
            //To update <publish:true> in <product> table
            pbody = await updateProduct(event); // PUT /product/{id}
            console.log(pbody);       
          } else {
            body = await deleteMarket(requestBody.id);
            event.httpMethod = "DELETE";
            //To update <publish:false> in <product> table
            pbody = await updateProduct(event); // PUT /product/{id}
            console.log(pbody);
          }
        }        
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }
    console.log(body);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust as needed
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'POST,GET',
        //'Access-Control-Expose-Headers': "X-Custom-Header",
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

const getMarket = async (productId) => {
  console.log("getMarket");
  try {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: marshall({ id: productId })
      };
   
      const { Item } = await ddbClient.send(new GetItemCommand(params));
  
      console.log(Item);
      return (Item) ? unmarshall(Item) : {};
  
    } catch(e) {
      console.error(e);
      throw e;
  }
}

const getAllMarkets = async () => {
  console.log("getAllMarkets");
  try {
    const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return (Items) ? Items.map((item) => unmarshall(item)) : {};

  } catch(e) {
      console.error(e);
      throw e;
  }
}

const createMarket = async (event) => {
  console.log(`createMarket function. event : "${event}"`);
  try {
    const requestBody = JSON.parse(event.body);
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

const deleteMarket = async (productId) => {
  console.log(`deleteMarket function. productId : "${productId}"`);
  try {    
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: marshall({ id: productId }),
    };   

    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
    console.log(deleteResult);
    return deleteResult;

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

const updateProduct = async (event) => {
  console.log(`updateProduct function. event : "${event}"`);
  try {
    const requestBody = JSON.parse(event.body);
    const productId = requestBody.id;
    // Replace this with the key of the item you want to remove
    const itemToRemove = "id"; 
    if (requestBody.hasOwnProperty(itemToRemove)) {
      delete requestBody[itemToRemove];
    }
    const objKeys = Object.keys(requestBody);
    if(requestBody.publish) {
      requestBody.publish = true;
    } else {
      requestBody.publish = false;
    }
    console.log(`updateProduct function. requestBody : "${requestBody}", objKeys: "${objKeys}"`);   
    // Get the current date and time using moment.js
    const moment = require('moment');
    const currentDateAndTime = moment().format('DD-MM-YYYY HH:mm:ss');    
    requestBody.modifiedDate = currentDateAndTime;    
   
    const params = {
      //TableName: process.env.DYNAMODB_TABLE_NAME,
      TableName: 'product',      
      //Key: marshall({ id: event.pathParameters.id }),
      Key: marshall({ id: productId }),
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