"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplImap = exports.markAsSeen = exports.DefaultImapFetchConfig = exports.DefaultImapConfig = void 0;
const mailparser_1 = require("mailparser");
const date_fns_1 = require("date-fns");
const imap_1 = __importDefault(require("imap"));
exports.DefaultImapConfig = {
    port: 993,
    tls: true,
};
exports.DefaultImapFetchConfig = {
    box: "INBOX",
    readonly: true,
    search: [
        "UNSEEN",
        ["SINCE", (0, date_fns_1.format)(new Date(Date.now() - 86400000), "MMMM d, yyyy")],
    ],
};
function markAsSeen(attributes, imap) {
    imap.addFlags(attributes.uid, ["\\Seen"], () => { });
}
exports.markAsSeen = markAsSeen;
function SimplImap(config, actionsOn, fetchConfig = exports.DefaultImapFetchConfig) {
    return new Promise((resolve, reject) => {
        const _config = Object.assign(Object.assign({}, exports.DefaultImapConfig), config);
        const imap = new imap_1.default(_config);
        imap.once("ready", function () {
            console.log("Ready");
            imap.openBox(fetchConfig.box, false, function (err, box) {
                if (err) {
                    imap.end();
                    if (err.message !== "Nothing to fetch") {
                        reject(err);
                    }
                }
                else {
                    imap.search(fetchConfig.search, function (err, messageIds) {
                        if (err) {
                            imap.end();
                            if (err.message !== "Nothing to fetch") {
                                reject(err);
                            }
                        }
                        else {
                            if (messageIds.length === 0) {
                                imap.end();
                            }
                            else {
                                const f = imap.fetch(messageIds, { bodies: "" });
                                f.on("message", function (msg, seqno) {
                                    // console.log("Message #%d", seqno);
                                    msg.on("body", function (stream, info) {
                                        // console.log("Body");
                                        (0, mailparser_1.simpleParser)(stream, (err, parsed) => {
                                            if (err) {
                                                reject(err);
                                            }
                                            // console.log("Parsed");
                                            if (actionsOn.messageBody) {
                                                try {
                                                    actionsOn.messageBody.forEach((cb) => cb(parsed, stream, info, imap));
                                                }
                                                catch (e) {
                                                    reject(e);
                                                }
                                            }
                                        });
                                    });
                                    msg.once("attributes", function (attrs) {
                                        if (actionsOn.messageAttributes) {
                                            try {
                                                actionsOn.messageAttributes.forEach((cb) => cb(attrs, imap));
                                            }
                                            catch (e) {
                                                reject(e);
                                            }
                                        }
                                    });
                                    if (actionsOn.message) {
                                        try {
                                            actionsOn.message.forEach((cb) => cb(msg, seqno, imap));
                                        }
                                        catch (e) {
                                            reject(e);
                                        }
                                    }
                                });
                                f.once("error", function (err) {
                                    if (actionsOn.error) {
                                        try {
                                            actionsOn.error.forEach((cb) => cb(err, imap));
                                        }
                                        catch (e) {
                                            reject(e);
                                        }
                                    }
                                    reject(err);
                                });
                                f.once("end", function () {
                                    if (actionsOn.end) {
                                        try {
                                            actionsOn.end.forEach((cb) => cb(imap));
                                        }
                                        catch (e) {
                                            reject(e);
                                        }
                                    }
                                    imap.end();
                                });
                            }
                        }
                    });
                }
            });
        });
        imap.once("error", function (err) {
            console.log("PLOP\n\n\n", err.message, "PLOP\n\n\n");
            if (err.message !== "Nothing to fetch") {
                if (actionsOn.error) {
                    try {
                        actionsOn.error.forEach((cb) => cb(err, imap));
                    }
                    catch (e) {
                        reject(e);
                    }
                }
            }
        });
        imap.once("end", function () {
            if (actionsOn.end) {
                try {
                    actionsOn.end.forEach((cb) => cb(imap));
                }
                catch (e) {
                    reject(e);
                }
            }
            resolve(true);
        });
        imap.on("close", function (hadError) {
            console.log("Connection closed", hadError ? "with error" : "");
        });
        imap.connect();
        console.log("Connecting...");
    });
}
exports.SimplImap = SimplImap;
//# sourceMappingURL=index.js.map