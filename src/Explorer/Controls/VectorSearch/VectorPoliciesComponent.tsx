import {
    IStyleFunctionOrObject,
    ITextFieldStyleProps,
    ITextFieldStyles,
    Label,
    Stack,
    TextField
} from "@fluentui/react";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import * as React from "react";

export interface VectorPoliciesComponentProps {
    vectorEmbeddings: VectorEmbedding[];
    onVectorEmbeddingChange: (
        vectorEmbeddings: VectorEmbedding[],
        vectorIndexingPolicies: VectorIndex[],
        validationPassed: boolean,
    ) => void;
    vectorIndexes?: VectorIndex[];
    forceUpdate?: boolean;
};

const textFieldStyles: IStyleFunctionOrObject<ITextFieldStyleProps, ITextFieldStyles> = {
    fieldGroup: {
        height: 27,
    },
    field: {
        fontSize: 12,
        padding: "0 8px",
    },
};

//CTODO: Delete me
export const VectorPoliciesComponent: React.FunctionComponent<VectorPoliciesComponentProps> = ({
    vectorEmbeddings,
    onVectorEmbeddingChange,
}): JSX.Element => {
    const [embeddings, setEmbeddings] = React.useState<VectorEmbedding[]>(vectorEmbeddings);

    React.useEffect(() => {
        onVectorEmbeddingChange(embeddings, undefined, true);
    }, [embeddings]);

    const onVectorEmbeddingPathChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value.trim();
        const newEmbeddings = [...embeddings];
        if (!value.startsWith("/")) {
            value = "/" + value;
        }
        newEmbeddings[index].path = value;
        setEmbeddings(newEmbeddings);
    };

    return (
        <Stack tokens={{ childrenGap: 4 }}>
            {embeddings && embeddings.length > 0 &&
                embeddings.map((vectorEmbedding: VectorEmbedding, index: number) => (
                    <CollapsibleSectionComponent
                        key={index}
                        isExpandedByDefault={true}
                        title={`Vector embedding ${index + 1}`}
                        showDelete={true}
                    // onDelete={() => onDelete(index)}
                    >
                        <Stack horizontal tokens={{ childrenGap: 4 }}>
                            <Stack
                                styles={{
                                    root: {
                                        margin: "0 0 6px 20px !important",
                                        paddingLeft: 20,
                                        width: "80%",
                                        borderLeft: "1px solid",
                                    },
                                }}
                            >
                                <Stack>
                                    <Label styles={{ root: { fontSize: 12 } }}>Path</Label>
                                    <TextField
                                        id={`vector-policy-path-${index + 1}`}
                                        required={true}
                                        placeholder="/vector1"
                                        styles={textFieldStyles}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onVectorEmbeddingPathChange(index, event)}
                                        value={vectorEmbedding.path || ""}
                                    // errorMessage={vectorEmbedding.pathError}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>
                    </CollapsibleSectionComponent>
                ))}
        </Stack>
    )
}