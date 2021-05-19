import { IsDisplayable, OnChange, RefreshOptions, Values } from "../Decorators";
import {
  Description,
  DescriptionType,
  InputType,
  NumberUiType,
  OnSaveResult,
  RefreshResult,
  SelfServeBaseClass,
  SmartUiInput,
} from "../SelfServeTypes";
import { initialize, refresh, update } from "./Demo.rp";

const onShowCommentsChanged = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>
): Map<string, SmartUiInput> => {
  const comments = currentValues.get("comments");
  const showComments = currentValues.get("showComments");
  showComments.value = newValue;

  // show the comments element only when toggle is true, hide comments when toggle is false
  comments.hidden = !newValue;

  currentValues.set("comments", comments);
  currentValues.set("showComments", showComments);
  return currentValues;
};

@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 1000 })
export default class Demo extends SelfServeBaseClass {
  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    const initialFeedback = await initialize();
    const resultMap = new Map<string, SmartUiInput>();
    const previousComments = initialFeedback.comments
      ? { value: { textTKey: initialFeedback.comments, type: DescriptionType.Text } as Description }
      : undefined;
    resultMap.set("previousComments", previousComments);
    resultMap.set("rating", { value: initialFeedback.rating });
    resultMap.set("showComments", { value: false });
    resultMap.set("comments", { value: "", hidden: true });
    return resultMap;
  };

  public onSave = async (currentValues: Map<string, SmartUiInput>): Promise<OnSaveResult> => {
    const rating = currentValues.get("rating")?.value as number;
    const currentComments = currentValues.get("comments")?.value as string;
    const comments = currentComments
      ? currentComments
      : (currentValues.get("previousComments")?.value as Description).textTKey;

    await update({ rating, comments });
    return {
      operationStatusUrl: undefined,
      portalNotification: {
        initialize: {
          messageTKey: "IntializeMesssage",
          titleTKey: "IntializeTitle",
        },
        success: {
          messageTKey: "SuccessMesssage",
          titleTKey: "SuccessTitle",
        },
        failure: {
          messageTKey: "FailureMesssage",
          titleTKey: "FailureTitle",
        },
      },
    };
  };

  public onRefresh = async (): Promise<RefreshResult> => {
    return refresh();
  };

  @Values({
    labelTKey: "PreviousCommentsLabel",
    isDynamicDescription: true,
  })
  previousComments: string;

  @Values({
    labelTKey: "RatingLabel",
    min: 0,
    max: 5,
    step: 1,
    uiType: NumberUiType.Slider,
  })
  rating: number;

  @OnChange(onShowCommentsChanged)
  @Values({
    labelTKey: "ShowCommentsLabel",
    trueLabelTKey: "ShowCommentsTrueLabel",
    falseLabelTKey: "ShowCommentsFalseLabel",
  })
  showComments: boolean;

  @Values({
    labelTKey: "CommentsLabel",
    placeholderTKey: "CommentsPlaceholder",
  })
  comments: string;
}
