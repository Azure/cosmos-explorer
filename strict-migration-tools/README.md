Borrowed from https://github.com/mjbvz/vscode-strict-null-check-migration-tools/tree/f1da7c12fe6e93618a310cb3662e2ade808be0c4

Scripts to help [migrate VS Code to use strict null checks](https://github.com/Microsoft/vscode/issues/60565)

## Usage

```bash
$ npm install
```

**index.js**

The main script prints of list of files that are eligible for strict null checks. This includes all files that only import files thare are already strict null checked.

```bash
$ node index.js /path/to/vscode
```

**autoAdd.js**

Very simple script that tries to auto add any eligible file to the `tsconfig.strictNullChecks.json`. This iteratively compiles the `tsconfig` project with just that file added. If there are no errors, it is added to the `tsconfig`

```bash
$ node autoAdd.js /path/to/vscode
```
