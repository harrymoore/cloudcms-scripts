## various activity using Cloud CMS API

### install:
    npm install
    download a gitana.json file with api credentials

### query a branch:
    node app -g ./gitana.json -q --query-file-path ./query.json -b master

### detach a branch from a release:
    node app -g ./gitana.json -x -b {branch-id}

### delete a branch from a release:
    node app -g ./gitana.json --delete-branch -b a7bcef2c0c8ef058434e

### reset branch tip
    node app -g ./gitana.json --reset-branch-tip -b b8f35e78486bdec6a7cc --branch-tip 74460:255c4a6741b8a222cc95 --prompt