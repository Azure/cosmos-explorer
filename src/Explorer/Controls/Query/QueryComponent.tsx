import * as React from "react";
import QueryTabV2 from "../../Tabs/QueryTabV2";

export interface QueryComponentProps {
    queryTab: QueryTabV2
}

interface QueryComponentState {

}

export class QueryComponent extends React.Component<QueryComponentProps, QueryComponentState> {
    public render() : JSX.Element {
        return (
            <h1>
                Query tab v2 is here
            </h1>
        )
    }
}