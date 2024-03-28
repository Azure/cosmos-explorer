import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { MonacoNamespace, monaco } from "Explorer/LazyMonaco";
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
    const configureEditor = (monaco: MonacoNamespace, editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.addAction({
            id: "execute-query",
            label: "Execute Query",
            keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
            run: props.onExecuteQuery,
        });
    }

    return <EditorReact
        language={"sql"}
        content={props.content}
        isReadOnly={false}
        wordWrap={"on"}
        ariaLabel={"Editing Query"}
        lineNumbers={"on"}
        onContentChanged={props.onContentChanged}
        onContentSelected={props.onContentSelected}
        configureEditor={configureEditor}
    />;
}
