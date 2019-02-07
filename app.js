/*jshint -W069 */
/*jshint -W104*/
const util = require("util");
const Gitana = require("gitana");
const async = require("async");
const cliArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const fs = require("fs");
const localUtil = require("./lib/util");
const Logger = require('basic-logger');
const log = new Logger({
    showMillis: false,
    showTimestamp: true
});
const request = require("request");


// debug only when using charles proxy ssl proxy when intercepting cloudcms api calls:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var options = handleOptions();
if (!options) {
    return;
}
if (options["verbose"]) {
    Logger.setLevel('debug', true);
} else {
    Logger.setLevel('info', true);
}

var option_prompt = options["prompt"];
var option_useCredentialsFile = options["use-credentials-file"];
var option_gitanaFilePath = options["gitana-file-path"] || "./gitana.json";
var option_branchId = options["branch"] || "master";
var option_query = options["query"];
var option_queryFilePath = options["query-file-path"];
var option_touch = options["touch"] || false;
var option_fixbranch = options["fixbranch"] || false;
var option_resetBranchTip = options["reset-branch-tip"] || false;
var option_resetBranchRoot = options["reset-branch-root"] || false;
var option_reactivateRelease = options["reactivate-release"] || false;
var option_listBranchChangesets = options["list-branch-changesets"] || false;
var option_listBranchChangesetContent = options["list-branch-changeset-content"] || false;
var option_branchTip = options["branch-tip"] || null;
var option_changeset = options["changeset"] || null;
var option_release = options["release"] || null;
var option_range = options["range"] || "1";
var option_deletebranch = options["delete-branch"] || false;
var option_create = options["create"] || false;
var option_ping = options["ping"] || false;
var option_nodePath = options["node-path"] || null;
var option_dataFilePath = options["data-file-path"] || null;
var option_test = options["test"] || false;
var option_nodeByPath = options["node-by-path"] || null;
var option_nodeById = options["node-by-id"] || null;
var option_nodeId = options["node-id"] || null;
var option_userName = options["username"];
var option_password = options["password"];

//
// load gitana.json config and override credentials
//
var gitanaConfig = JSON.parse("" + fs.readFileSync(option_gitanaFilePath));
if (option_useCredentialsFile) {
    // override gitana.json credentials with username and password properties defined in the cloudcms-cli tool local db
    var rootCredentials = JSON.parse("" + fs.readFileSync(path.join(localUtil.homeDirectory(), ".cloudcms", "credentials.json")));
    gitanaConfig.username = rootCredentials.username;
    gitanaConfig.password = rootCredentials.password;
} else if (option_prompt) {
    // override gitana.json credentials with username and password properties entered at command prompt
    var option_prompt = require('prompt-sync')({
        sigint: true
    });
    gitanaConfig.username = option_prompt('name: ');
    gitanaConfig.password = option_prompt.hide('password: ');
} // else don't override credentials

// if listing types
if (option_test) {
    handleTest();
} else if (option_touch) {
    handleTouch();
} else if (option_fixbranch) {
    fixBranch();
} else if (option_resetBranchTip) {
    resetBranchTip();
} else if (option_resetBranchRoot) {
    resetBranchRoot();
} else if (option_listBranchChangesets) {
    listBranchChangesets();
} else if (option_reactivateRelease) {
    reactivateRelease();
} else if (option_listBranchChangesetContent) {
    listBranchChangesetContent();
} else if (option_deletebranch) {
    deletebranch();
} else if (option_query) {
    handleQuery();
} else if (option_ping) {
    handlePing();
} else if (option_create) {
    handleNodePathCreate();
} else if (option_nodeByPath) {
    handleFindNodeByPath();
} else if (option_nodeById) {
    handleFindNodeById();
} else {
    printHelp(getOptions());
}

return;

//
// functions
//
function handleTest() {
    log.debug("handleTest()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" branch: \"" + (branch.title || branch._doc) + "\"");
    });

}

function handlePing() {
    log.debug("handlePing()");

    var url = gitanaConfig.baseURL + "/ping";
    auth = "Basic " + new Buffer(option_userName + ":" + option_password).toString("base64");

    request({
            method: "GET",
            url: url,
            headers: {
                "Authorization": auth
            }
        },
        function (error, response, body) {
            if (error || response.statusCode !== 200) {
                log.error("error in request " + JSON.stringify(error || {}) + " " + JSON.stringify(body));
            } else {
                log.info("completed request: " + JSON.stringify(body));
            }
        }
    );
}

function handleFindNodeByPath() {
    log.debug("handleFindNodeByPath()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        var nodePath = option_nodePath;

        log.info("find node at path: " + nodePath);

        Chain(branch).trap(function (err) {
            log.error(err);
        }).readNode("root", nodePath, {
            paths: true
        }).then(function () {
            var node = this;
            localUtil.enhanceNode(node);
            log.info(".then " + JSON.stringify(this, null, 2));
        });
    });
}

function handleFindNodeById() {
    log.debug("handleFindNodeById()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        var nodeId = option_nodeId;

        log.info("find node with id: " + nodeId);

        Chain(branch).trap(function (err) {
            log.error(err);
        }).readNode(nodeId, null, {
            paths: true
        }).then(function () {
            var node = this;
            localUtil.enhanceNode(node);
            log.info(".then " + JSON.stringify(this, null, 2));
        });
    });
}

function handleNodePathCreate() {
    log.debug("handleNodePathCreate()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        var nodeData = require(option_dataFilePath),
            nodePath = option_nodePath;

        nodeData._filePath = nodePath;

        log.info("create node: " + JSON.stringify(nodeData, null, 2));

        Chain(branch).trap(function (err) {
            log.error(err);
        }).createNode(nodeData).then(function () {
            var node = this;
            localUtil.enhanceNode(node);
            log.info(".then " + JSON.stringify(this, null, 2));
        });
    });
}

function handleTouch() {
    log.debug("handleTouch()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        var context = {
            branchId: option_branchId,
            branch: branch,
            queryFilePath: option_queryFilePath,
            query: require(option_queryFilePath),
            nodes: []
        };

        async.waterfall([
            async.ensureAsync(async.apply(getNodesFromQuery, context)),
                async.ensureAsync(touchNodes)
        ], function (err, context) {
            if (err) {
                log.error("Error: " + err);
                return;
            }

            log.info("Touch complete");
            return;
        });
    });
}

function listBranchChangesets() {
    log.debug("listBranchChangesets()");

    log.debug("option_changeset: " + option_changeset);
    log.debug("option_range: " + option_range);

    if (!option_changeset) {
        log.error("You must specify --changeset");
        return;
    }

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        Chain(branch).then(function () {
            var branch = this;
            log.info("Branch getRepositoryId: " + branch.getRepositoryId());
            log.info("Branch tip: " + branch.getTip());

            branch.getRepository().readChangeset(option_changeset).then(function () {
                var changeset = this;
                log.info("changeset: " + JSON.stringify(changeset, null, 2));

                return;
            });
        });
    });
}

function listBranchTipContent() {
    log.debug("listBranchTipContent()");

}

function reactivateRelease() {
    log.debug("reactivateRelease()");

    if (!option_release) {
        log.error("You must specify --release");
        return;
    }

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: \"" + branch.title + "\" " + branch._doc);

        Chain(branch).then(function () {
            var branch = this;
            log.info("Branch getRepositoryId: " + branch.getRepositoryId());
            log.info("Branch tip: " + branch.getTip());

            branch.getRepository().readRelease(option_release).then(function () {
                var release = this;                
                log.info("release: " + JSON.stringify(release, null, 2));

                release.executed = false;
                release.released = false;

                release.update().then(function () {
                    var release = this;
                    log.info(JSON.stringify(release, null, 2));
                    return;
                });    
            });
        });
    });
}

function resetBranchTip() {
    log.debug("resetBranchTip()");

    if (!option_branchTip) {
        log.error("You must specify --branch-tip");
        return;
    }

    if (!option_branchId) {
        log.error("You must specify --branch (or -b)");
        return;
    }

    if (!option_prompt && (!option_userName || !option_password)) {
        log.error("You must use either --prompt or --username and --password to admin credentials");
        return;
    }

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        // POST /repositories/b2b734bac0c566826f59/branches/b8f35e78486bdec6a7cc/admin/reset?tip=74460:255c4a6741b8a222cc95
        var url = gitanaConfig.baseURL + "/repositories/" + branch.getRepositoryId() + "/branches/" + branch._doc + "/admin/reset?tip=" + option_branchTip;
        log.info("url = " + url);

        request({
                method: "POST",
                url: url,
                headers: {
                    "Authorization": platform.getDriver().http.getBearerAuthorizationHeader()
                }
            },
            function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    log.error("error in request " + JSON.stringify(error || {}) + " " + JSON.stringify(body));
                } else {
                    log.info("completed request: " + JSON.stringify(body));
                }
            }
        );
            
    });
}

function resetBranchRoot() {
    log.debug("resetBranchRoot()");

    if (!option_changeset) {
        log.error("You must specify --changeset");
        return;
    }

    if (!option_branchId) {
        log.error("You must specify --branch (or -b)");
        return;
    }

    if (!option_prompt && (!option_userName || !option_password)) {
        log.error("You must use either --prompt or --username and --password to admin credentials");
        return;
    }

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        // POST /repositories/b2b734bac0c566826f59/branches/b8f35e78486bdec6a7cc/admin/reset?root=74461:a23d761dc0d41777a1b7
        var url = gitanaConfig.baseURL + "/repositories/" + branch.getRepositoryId() + "/branches/" + branch._doc + "/admin/reset?root=" + option_changeset;
        log.info("url = " + url);

        request({
                method: "POST",
                url: url,
                headers: {
                    "Authorization": platform.getDriver().http.getBearerAuthorizationHeader()
                }
            },
            function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    log.error("error in request " + JSON.stringify(error || {}) + " " + JSON.stringify(body));
                } else {
                    log.info("completed request: " + JSON.stringify(body));
                }
            }
        );
            
    });
}

function deletebranch() {
    log.debug("deletebranch()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        Chain(branch).then(function () {
            var branch = this;

            log.info(JSON.stringify(branch, null, 2));

            // first detach from release
            branch.releaseId = null;

            branch.update().then(function () {
                var branch = this;
                log.info(JSON.stringify(branch, null, 2));

                branch.del().then(function () {
                    log.info("deletebranch complete");
                    return;
                });
            });
        });
    });
}

function fixBranch() {
    log.debug("fixBranch()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: " + branch.title || branch._doc);

        Chain(branch).then(function () {
            var branch = this;

            log.info(JSON.stringify(branch, null, 2));

            branch.releaseId = null;

            branch.update().then(function () {
                var branch = this;
                log.info(JSON.stringify(branch, null, 2));
                log.info("fixBranch complete");
                return;
            });
        });

    });
}

function handleQuery() {
    log.debug("handleQuery()");

    localUtil.getBranch(gitanaConfig, option_branchId, function (err, branch, platform, stack, domain, primaryDomain, project) {
        if (err) {
            log.debug("Error connecting to Cloud CMS branch: " + JSON.stringify(err, null, 2));
            return;
        }

        log.info("connected to project: \"" + project.title + "\" and branch: \"" + branch.title + "\" " + branch._doc);

        var context = {
            branchId: option_branchId,
            branch: branch,
            queryFilePath: option_queryFilePath,
            query: require(option_queryFilePath),
            nodes: []
        };

        async.waterfall([
            async.ensureAsync(async.apply(getNodesFromQuery, context)),
                async.ensureAsync(reportNodes)
        ], function (err, context) {
            if (err) {
                log.error("Error: " + err);
                return;
            }

            log.info("Query complete");
            return;
        });
    });
}

function reportNodes(context, callback) {
    log.info("reportNodes()");

    for (var i = 0; i < context.nodes.length; i++) {
        var node = context.nodes[i];
        // util.enhanceNode(node);
        log.info(node._doc);
        // log.info(node._doc + "\n" + console.log(util.inspect(node, {depth: 1, colors: true, compact: false})));
    }

    callback(null, context);
}

function getNodesFromQuery(context, callback) {
    log.info("getNodesFromQuery()");

    var query = context.query;

    context.branch.queryNodes(query, {
        limit: -1
        // }).each(function() {
        //     var node = this;
        //     util.enhanceNode(node);
        //     context.nodes.push(node);
    }).then(function () {
        context.nodes = this.asArray();
        callback(null, context);
    });
}

function touchNodes(context, callback) {
    log.info("touchNodes()");

    var nodes = context.nodes;

    async.eachSeries(nodes, function (node, cb) {
        log.info("touching " + node._doc);

        Chain(node).touch().then(function () {
            cb();
        });
    }, function (err) {
        if (err) {
            log.error("Error touching nodes: " + err);
            callback(err);
            return;
        }

        log.debug("touch complete");
        callback(null, context);
        return;
    });
}

function getOptions() {
    return [{
            name: 'help',
            alias: 'h',
            type: Boolean
        },
        {
            name: 'verbose',
            alias: 'v',
            type: Boolean,
            description: 'verbose logging'
        },
        {
            name: 'prompt',
            alias: 'p',
            type: Boolean,
            description: 'prompt for username and password. overrides gitana.json credentials'
        },
        {
            name: 'use-credentials-file',
            alias: 'c',
            type: Boolean,
            description: 'use credentials file ~/.cloudcms/credentials.json. overrides gitana.json credentials'
        },
        {
            name: 'touch',
            alias: 'u',
            type: Boolean,
            description: 'touch nodes in query results'
        },
        {
            name: 'fixbranch',
            alias: 'x',
            type: Boolean,
            description: 'fixbranch'
        },
        {
            name: 'reset-branch-tip',
            type: Boolean,
            description: 'reset a branch tip to the changeset id specified in --branch-tip'
        },
        {
            name: 'reset-branch-root',
            type: Boolean,
            description: 'reset a branch root changeset specified in --changeset'
        },
        {
            name: 'reactivate-release',
            type: Boolean,
            description: 'restore a release branch to a state where it can be released again'
        },
        {
            name: 'list-branch-changesets',
            type: Boolean,
            description: 'list branch tips. show all tips unless --starting-branch-tip specified'
        },
        {
            name: 'list-branch-changeset-content',
            type: Boolean,
            description: 'list content ids (_doc) for updates in branch tips starting at tip specified in --changeset and for each tip after up to number of tips in --range'
        },
        {
            name: 'range',
            type: String,
            default: "1",
            description: 'list content ids (_doc) for updates in branch tips starting at tip specified in --changeset. Default is 1'
        },
        {
            name: 'changeset',
            type: String,
            description: 'changeset id to'
        },
        {
            name: 'branch-tip',
            type: String,
            description: 'branch tip id'
        },
        {
            name: 'release',
            type: String,
            description: 'release id'
        },        
        {
            name: 'delete-branch',
            type: Boolean,
            description: 'delete a branch. this will first detach the branch from any release it may be attached to.'
        },
        {
            name: 'create',
            alias: 'r',
            type: Boolean,
            description: 'create node by path'
        },
        {
            name: 'ping',
            type: Boolean,
            description: 'ping the api server'
        },
        {
            name: 'node-by-path',
            alias: 'n',
            type: Boolean,
            description: 'find a node by path specified in --node-path'
        },
        {
            name: 'node-path',
            alias: 'o',
            type: String,
            description: 'node path'
        },
        {
            name: 'node-by-id',
            alias: 'i',
            type: Boolean,
            description: 'find a node by ID specified in --node-id'
        },
        {
            name: 'node-id',
            alias: 'e',
            type: String,
            description: 'node id'
        },
        {
            name: 'data-file-path',
            alias: 'd',
            type: String,
            description: 'path to a json file to use as the data for node created by --create option when connecting'
        },
        {
            name: 'test',
            alias: 't',
            type: Boolean,
            description: 'test connection to cloud cms'
        },
        {
            name: 'query',
            alias: 'q',
            type: Boolean,
            description: 'run a query. use with --query-file-path option'
        },
        {
            name: 'gitana-file-path',
            alias: 'g',
            type: String,
            description: 'path to gitana.json file to use when connecting. defaults to ./gitana.json'
        },
        {
            name: 'branch',
            alias: 'b',
            type: String,
            description: 'branch id (not branch name!) to write content to. branch id or "master". Default is "master"'
        },
        {
            name: 'query-file-path',
            alias: 'y',
            type: String,
            description: 'path to a json file defining the query'
        },
        {
            name: 'username',
            type: String,
            description: 'username'
        },
        {
            name: 'password',
            type: String,
            description: 'password'
        }
    ];
}

function handleOptions() {

    var options = cliArgs(getOptions());

    if (options.help) {
        printHelp();
        return null;
    }

    return options;
}

function printHelp(optionsList) {
    console.log(getUsage([{
            header: 'Cloud CMS Script',
            content: 'Touch nodes a Cloud CMS project branch.'
        },
        {
            header: 'Options',
            optionList: optionsList
        },
        {
            header: 'Examples',
            content: [{
                    desc: '1. test connection to cloud cms',
                },
                {
                    desc: 'node app.js --gitana-file-path ./gitana.json --test'
                },
                {
                    desc: '1. touch nodes found by query',
                },
                {
                    desc: 'node app.js --gitana-file-path ./gitana.json --touch --query-file-path ./touch-query.json'
                }
            ]
        }
    ]));
}