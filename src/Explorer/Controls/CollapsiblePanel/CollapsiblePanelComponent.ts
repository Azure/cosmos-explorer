import * as ko from "knockout";
import template from "./collapsible-panel-component.html";

/**
 * Helper class for ko component registration
 */
export class CollapsiblePanelComponent {
  constructor() {
    return {
      viewModel: CollapsiblePanelViewModel,
      template
    };
  }
}

/**
 * Parameters for this component
 */
interface CollapsiblePanelParams {
  collapsedTitle: ko.Observable<string>;
  expandedTitle: ko.Observable<string>;
  isCollapsed?: ko.Observable<boolean>;
  collapseToLeft?: boolean;
}

/**
 * Collapsible panel:
 *  Contains a header with [>] button to collapse and an title ("expandedTitle").
 *  Collapsing the panel:
 *   - shrinks width to narrow amount
 *   - hides children
 *   - shows [<]
 *   - shows vertical title ("collapsedTitle")
 *   - the default behavior is to collapse to the right (ie, place this component on the right or use "collapseToLeft" parameter)
 *
 * How to use in your markup:
 * <collapsible-panel params="{ collapsedTitle:'Properties', expandedTitle:'Expanded properties' }">
 *      <!-- add your markup here: the ko context is the same as outside of collapsible-panel (ie $data) -->
 * </collapsible-panel>
 *
 * Use the optional "isCollapsed" parameter to programmatically collapse/expand the pane from outside the component.
 * Use the optional "collapseToLeft" parameter to collapse to the left.
 */
class CollapsiblePanelViewModel {
  public params: CollapsiblePanelParams;
  private isCollapsed: ko.Observable<boolean>;

  public constructor(params: CollapsiblePanelParams) {
    this.params = params;
    this.isCollapsed = params.isCollapsed || ko.observable(false);
  }

  public toggleCollapse(): void {
    this.isCollapsed(!this.isCollapsed());
  }
}
