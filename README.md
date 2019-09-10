## Various utility functions and examples using the Cloud CMS API

### install:

    npm install
    download a gitana.json file with api credentials

### query a branch:

    node app -g ./gitana.json -q --query-file-path ./query.json -b master
    node app -g ./gitana-ers.json -q --query-file-path ./query.json -b 768ad1ac43330dbc16a2

### traverse a node:

    node app -g ./gitana-ers.json --traverse --query-file-path ./query/traverse-config.json -b 768ad1ac43330dbc16a2 --node-id c839f15f6cfbdd1c8045

### detach a branch from a release:

    node app -g ./gitana.json -x -b {branch-id}

### delete a branch from a release:

    node app -g ./gitana.json --delete-branch -b a7bcef2c0c8ef058434e

### reset branch tip changeset

    node app -g ./gitana.json --reset-branch-tip -b b8f35e78486bdec6a7cc --branch-tip 79016:0ac046fa608804257265 --prompt

### reset branch root changeset

    must run as admin so use --prompt and enter admin credentials
    node app -g ./gitana.json --reset-branch-root -b b8f35e78486bdec6a7cc --changeset 74461:a23d761dc0d41777a1b7 --prompt

<!-- ### list branch changesets
    node app -g ./gitana.json --list-branch-changesets -b b8f35e78486bdec6a7cc --changeset 74460:255c4a6741b8a222cc95 --range 5

### list branch changeset content _doc ids
    node app -g ./gitana.json --list-branch-changeset-content -b b8f35e78486bdec6a7cc --changeset 74460:255c4a6741b8a222cc95 --range -1 -->

### reactivate a release

    node app -g ./gitana.json -b b8f35e78486bdec6a7cc --reactivate-release --release b5f71da6a9563d93a33d

(you may also need to reset branch tip changeset id to 79016:0ac046fa608804257265. finally, merge the release/branch again)
node app -g ./gitana.json --list-branch-changesets -b b8f35e78486bdec6a7cc --changeset 79016:0ac046fa608804257265

###########################
"snapshotChangesetId" : "74461:a23d761dc0d41777a1b7",
"snapshotId" : "2214c98234642098936e",
"executed" : true
"released" : true

Branch getRepositoryId: b2b734bac0c566826f59
"releaseId" : "b5f71da6a9563d93a33d",
reset tip to 79016:0ac046fa608804257265
