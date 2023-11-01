import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface EsgEventBusProps {
    publisherFuntion: IFunction;
    targetFuntion: IFunction;
}

export class EsgEventBus extends Construct {

    constructor(scope: Construct, id: string, props: EsgEventBusProps) {
        super(scope, id);

        //eventbus
        const bus = new EventBus(this, 'EsgEventBus', {
            eventBusName: 'EsgEventBus'
        });
    
        const checkoutBasketRule = new Rule(this, 'CheckoutBasketRule', {
            eventBus: bus,
            enabled: true,
            description: 'When Basket microservice checkout the basket',
            eventPattern: {
                source: ['com.esg.basket.checkoutbasket'],
                detailType: ['CheckoutBasket']
            },
            ruleName: 'CheckoutBasketRule'
        });
    
        // need to pass target to Ordering Lambda service
        checkoutBasketRule.addTarget(new LambdaFunction(props.targetFuntion)); 
        
        bus.grantPutEventsTo(props.publisherFuntion);
            // AccessDeniedException - is not authorized to perform: events:PutEvents

    }

}