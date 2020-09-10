import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";
import { QueryComponentAdapter } from "../Controls/Query/QueryComponentAdapter"
import { QueryComponentProps } from "../Controls/Query/QueryComponent";

export default class QueryTabV2 extends TabsBase {
  public queryComponentAdapter: QueryComponentAdapter;

  constructor(options: ViewModels.QueryTabOptions) {
    super(options);
    
    const props: QueryComponentProps = {
      queryTab: this
    };
    this.queryComponentAdapter = new QueryComponentAdapter(props);
  }
}