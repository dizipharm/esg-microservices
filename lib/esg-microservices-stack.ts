import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EsgDatabase } from './database';
import { EsgMicroservices } from './microservice';
import { EsgApiGateway } from './apigateway';

export class EsgMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new EsgDatabase(this, 'Database');    

    const microservices = new EsgMicroservices(this, 'Microservices', {
      productTable: database.productTable,
      marketTable: database.marketTable,
      basketTable: database.basketTable
    });

    const apigateway = new EsgApiGateway(this, 'ApiGateway', {
      productMicroservice: microservices.productMicroservice,
      marketMicroservice: microservices.marketMicroservice,
      basketMicroservice: microservices.basketMicroservice
    });    
  }
}