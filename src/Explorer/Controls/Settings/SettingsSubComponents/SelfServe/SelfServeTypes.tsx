
import "reflect-metadata";

const SqlXPropertiesKey = 'SqlXPropertiesKey';

const modifyParentProperty = (context: any, parentProperty: string, property: string | symbol) : any => {
    if (parentProperty in context) {
        context[parentProperty][property] ={}
        return context
    } else {
        const keys = Object.keys(context)
        for(var i =0; i< keys.length; i++) {
            context[keys[i]] = modifyParentProperty(context[keys[i]], parentProperty, property)
            return context
        }
    }
    return context
}

export const Property = (parentProperty?: string): PropertyDecorator => {
    return (target, property) => {
      let context = Reflect.getMetadata(SqlXPropertiesKey, target)
      if(!context) {
        context = {}
      }
      if (parentProperty) {
          const prevContextValue  = JSON.stringify(context) 
          context = modifyParentProperty(context, parentProperty, property)
          if (JSON.stringify(context) === prevContextValue) {
              throw new Error(`${parentProperty} not defined. declare it before the child property with @Property decorator.`)
          }
      } else {
          context[property] = {}
      }
      console.log("context:" + JSON.stringify(context))
      Reflect.defineMetadata(SqlXPropertiesKey, context, target)
    };
};

export class SqlX {
    @Property()
    static prop1: any;

    @Property()
    static prop2: any;

    @Property("prop1")
    static prop11: any;


    public static toJson = () : any => {
        return Reflect.getMetadata(SqlXPropertiesKey, SqlX)
    }
}

