/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import IToolbarDisplayable from "./IToolbarDisplayable";

interface IToolbarAction extends IToolbarDisplayable {
  type: "action";
  action: () => void;
}

export default IToolbarAction;
