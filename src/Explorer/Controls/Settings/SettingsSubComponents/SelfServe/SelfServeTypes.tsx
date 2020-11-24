
import "reflect-metadata";
import { EnumItem, Info, InputTypeValue } from "../../../SmartUi/SmartUiComponent";

const modifyParentProperty = (children: {[key: string]: any}, parentProperty: string, property: string | symbol) : any => {
    if (parentProperty in children) {
        children[parentProperty][property] ={id: property, input: {}}
        return children
    } else {
        const keys = Object.keys(children)
        for(var i =0; i< keys.length; i++) {
            children[keys[i]] = modifyParentProperty(children[keys[i]], parentProperty, property)
            return children
        }
    }
    return children
}

export const InfoBar = (metadataKey: string, info: Info) => {
    return (target: any) => {
        let context = Reflect.getMetadata(metadataKey, target)
        if(!context) {
          context = {id: "root", info: info,  input: undefined, children: {} }
        } else {
          context.info = info
        }
        console.log("class context:" + JSON.stringify(context))
        Reflect.defineMetadata(metadataKey, context, target)  
    };
};

export const Property = (metadataKey: string, parentProperty?: string): PropertyDecorator => {
    return (target, property) => {
      let context = Reflect.getMetadata(metadataKey, target)
      if(!context) {
        context = {id: "root", info: undefined,  input: undefined, children: {} }
        context.children[property] = {id: property, input: {}}
      }
      if (parentProperty) {
          const prevContextValue  = JSON.stringify(context) 
          context.children = modifyParentProperty(context.children, parentProperty, property)
          if (JSON.stringify(context) === prevContextValue) {
              throw new Error(`${parentProperty} not defined. declare it before the child property with @Property decorator.`)
          }
      } else {
          context.children[property] = {id: property, input: {}}
      }
      console.log("props context:" + JSON.stringify(context))
      Reflect.defineMetadata(metadataKey, context, target)
    };
};

export const modifyInputTypes = (metadataKey: string, fieldName: string, value: any) : PropertyDecorator => {
    return (target, property) => {
        let context = Reflect.getMetadata(metadataKey, target)
        if(!context) {
            throw new Error("Incorrect order")
        }
        context.children[property].input[fieldName] = value
        //context = modifyType(property)
        console.log("props context:" + JSON.stringify(context))
        Reflect.defineMetadata(metadataKey, context, target)
      };
}

export const Type = (metadataKey: string, type: InputTypeValue): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "type", type)
};

export const Label = (metadataKey: string, label: string): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "label", label)
};

export const DataFieldName = (metadataKey: string, dataFieldName: string): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "dataFieldName", dataFieldName)
};

export const Min = (metadataKey: string, min: number): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "min", min)
};

export const Max = (metadataKey: string, max: number): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "max", max)
};

export const Step = (metadataKey: string, step: number): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "step", step)
};

export const DefaultValue = (metadataKey: string, defaultValue: any): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "defaultValue", defaultValue)
};

export const TrueLabel = (metadataKey: string, trueLabel: string): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "trueLabel", trueLabel)
};

export const FalseLabel = (metadataKey: string, falseLabel: string): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "falseLabel", falseLabel)
};

export const Choices = (metadataKey: string, choices: EnumItem[]): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "choices", choices)
};

export const DefaultKey = (metadataKey: string, defaultKey: string): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "defaultKey", defaultKey)
};

export const NumberInputType = (metadataKey: string, numberInputType: string): PropertyDecorator => {
    return modifyInputTypes(metadataKey, "inputType", numberInputType)
};
