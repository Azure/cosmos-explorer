/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

export const LogError = (message: string) => {
    return `\n\r\x1B[1;37m${message}`;
}

export const LogInfo = (message: string) => {
    return `\x1B[1;37m${message}`;
}