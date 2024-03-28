import React from "react";

export type QueryEditorProps = {
    content: string
    onContentChanged: (newContent: string) => void;
    onContentSelected: (selectedContent: string) => void;
    
    /**
     * Callback that will run when the "Execute Query" command is invoked.
     */
    onExecuteQuery: () => void;
};

export const QueryEditor: React.FunctionComponent<QueryEditorProps> = (props) => {
}
