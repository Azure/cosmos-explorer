/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import IToolbarAction from "./IToolbarAction";
import IToolbarToggle from "./IToolbarToggle";
import IToolbarSeperator from "./IToolbarSeperator";
import IToolbarDropDown from "./IToolbarDropDown";

type IToolbarItem = IToolbarAction | IToolbarToggle | IToolbarSeperator | IToolbarDropDown;

export default IToolbarItem;
