import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface EsgApiGatewayProps {
    productMicroservice: IFunction,
    marketMicroservice: IFunction,
    basketMicroservice: IFunction
}

export class EsgApiGateway extends Construct {    

    constructor(scope: Construct, id: string, props: EsgApiGatewayProps) {
        super(scope, id);

        // Product api gateway
        this.createProductApi(props.productMicroservice);
        // Market api gateway
        this.createMarketApi(props.marketMicroservice);
        // Basket api gateway
        this.createBasketApi(props.basketMicroservice);
    }

    private createProductApi(productMicroservice: IFunction) {
      // Product microservices api gateway
      // root name = product

      // GET /product
      // POST /product

      // Single product with id parameter
      // GET /product/{id}
      // PUT /product/{id}
      // DELETE /product/{id}

      const apigw = new LambdaRestApi(this, 'productApi', {
        restApiName: 'Product Service',
        handler: productMicroservice,
        proxy: false
      });

      // Create a resource (e.g., /items) to configure CORS for
    //const itemsResource = apigw.root.addResource('items');

     // Configure CORS
    // apigw.addCorsPreflight({
    //     allowOrigins: ['*'], // You can specify specific origins or use '*' for any origin
    //     allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the HTTP methods allowed
    //     allowHeaders: ['*'], // Specify allowed headers or use '*' for any header
    //     disablePreflight: false, // Set this to true to disable preflight requests if needed
    // });
  
      const product = apigw.root.addResource('product');
      product.addMethod('GET'); // GET /product
      product.addMethod('POST');  // POST /product
      
      const singleProduct = product.addResource('{id}'); // product/{id}
      singleProduct.addMethod('GET'); // GET /product/{id}
      singleProduct.addMethod('PUT'); // PUT /product/{id}
      singleProduct.addMethod('DELETE'); // DELETE /product/{id}
    }

    private createMarketApi(marketMicroservice: IFunction) {
        // Publish microservices api gateway
        // root name = publish

        // GET /publish
        // POST /publish

        // // Single publish with userName parameter - resource name = publish/{userName}
        // GET /publish/{userName}
        // DELETE /publish/{userName}

        // checkout publish async flow
        // POST /publish/checkout

        const apigw = new LambdaRestApi(this, 'marketApi', {
            restApiName: 'Market Service',
            handler: marketMicroservice,
            proxy: false
        });

        const market = apigw.root.addResource('market');
        market.addMethod('GET'); // GET /market
        market.addMethod('POST');  // POST /market
        
        const singleProduct = market.addResource('{id}'); // market/{id}
        singleProduct.addMethod('GET'); // GET /market/{id}
        //singleProduct.addMethod('PUT'); // PUT /market/{id}
        //singleProduct.addMethod('POST'); // POST /market/{id}
        singleProduct.addMethod('DELETE'); // DELETE /market/{id}

        // const market = apigw.root.addResource('market');
        // market.addMethod('GET');  // GET /publish
        // market.addMethod('POST');  // POST /publish

        // const singlePublish = market.addResource('{id}'); 

        // singlePublish.addMethod('GET');  // GET /publish/{userName}
        // singlePublish.addMethod('DELETE'); // DELETE /publish/{userName}

        // const publishCheckout = market.addResource('checkout');
        // publishCheckout.addMethod('POST'); // POST /publish/checkout
        //     // expected request payload : { userName : swn }
    }


    private createBasketApi(basketMicroservice: IFunction) {
      // Basket microservices api gateway
      // root name = basket

      // GET /basket
      // POST /basket

      // // Single basket with userName parameter - resource name = basket/{userName}
      // GET /basket/{userName}
      // DELETE /basket/{userName}

      // checkout basket async flow
      // POST /basket/checkout

      const apigw = new LambdaRestApi(this, 'basketApi', {
          restApiName: 'Basket Service',
          handler: basketMicroservice,
          proxy: false
      });

      const basket = apigw.root.addResource('basket');
      basket.addMethod('GET');  // GET /basket
      basket.addMethod('POST');  // POST /basket

      //const singleBasket = basket.addResource('{userName}');
      const singleBasket = basket.addResource('{id}');
      singleBasket.addMethod('GET');  // GET /basket/{userName}
      singleBasket.addMethod('PUT'); // PUT /basket/{id}
      singleBasket.addMethod('DELETE'); // DELETE /basket/{userName}

      const basketCheckout = basket.addResource('checkout');
      basketCheckout.addMethod('POST'); // POST /basket/checkout
          // expected request payload : { userName : swn }
  }

}