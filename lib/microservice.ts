import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface EsgMicroservicesProps {
    productTable: ITable;
    marketTable: ITable;
    basketTable: ITable;
}

export class EsgMicroservices extends Construct {

  public readonly productMicroservice: NodejsFunction;
  public readonly marketMicroservice: NodejsFunction;
  public readonly basketMicroservice: NodejsFunction;

  constructor(scope: Construct, id: string, props: EsgMicroservicesProps) {
    super(scope, id);

    // product microservices
    this.productMicroservice = this.createProductFunction(props.productTable);
    // market microservices
    this.marketMicroservice = this.createMarketFunction(props.marketTable, props.productTable);
    // basket microservices
    this.basketMicroservice = this.createBasketFunction(props.basketTable);
  }

  private createProductFunction(productTable: ITable) : NodejsFunction {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk'
        ]
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: productTable.tableName
      },
      runtime: Runtime.NODEJS_14_X
    }

    // Product microservices lambda function
    const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsFunctionProps,
    });

    productTable.grantReadWriteData(productFunction); 
    
    return productFunction;
  }

  private createMarketFunction(marketTable: ITable, productTable: ITable) : NodejsFunction {
    const marketFunctionProps: NodejsFunctionProps = {
      bundling: {
          externalModules: [
              'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
          ],
      },
      environment: {
          PRIMARY_KEY: 'id',
          DYNAMODB_TABLE_NAME: marketTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    // Market microservices lambda function
    const marketFunction = new NodejsFunction(this, 'marketLambdaFunction', {
      entry: join(__dirname, `/../src/market/index.js`),
      ...marketFunctionProps,
    });

    marketTable.grantReadWriteData(marketFunction);
    productTable.grantReadWriteData(marketFunction);

    return marketFunction;
  }


  private createBasketFunction(basketTable: ITable) : NodejsFunction {
    const basketFunctionProps: NodejsFunctionProps = {
      bundling: {
          externalModules: [
              'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
          ],
      },
      environment: {
          PRIMARY_KEY: 'id',
          DYNAMODB_TABLE_NAME: basketTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    const basketFunction = new NodejsFunction(this, 'basketLambdaFunction', {
      entry: join(__dirname, `/../src/basket/index.js`),
      ...basketFunctionProps,
    });

    basketTable.grantReadWriteData(basketFunction);
    return basketFunction;
  }
  

}