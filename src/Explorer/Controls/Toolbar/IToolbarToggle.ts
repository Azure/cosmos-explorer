/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import IToolbarDisplayable from "./IToolbarDisplayable";

interface IToolbarToggle extends IToolbarDisplayable {
  type: "toggle";
  checked: ko.Observable<boolean>;
  toggle: () => void;
}
export default IToolbarToggle;
