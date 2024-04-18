import { ParsedMail as _ParsedMail, Source, simpleParser } from "mailparser";
import { format as DateFormat } from "date-fns";

import Connection, { Config } from "imap";
// import Connection, { IConfig } from "@lovely-inbox/imap";
// export type Config = IConfig

export type ParsedMail = _ParsedMail;
export type ImapConfig = {
  user: string;
  password: string;
  host: string;
} & Partial<Config>;

export const DefaultImapConfig: Partial<Config> = {
  port: 993,
  tls: true,
};

export type ImapFetchConfig = {
  box: string;
  readonly: boolean;
  search: string[] | string[][] | (string | string[])[]; // ["UNSEEN", ["SINCE", "September 20, 2022"]]
};

export const DefaultImapFetchConfig: ImapFetchConfig = {
  box: "INBOX",
  readonly: true,
  search: [
    "UNSEEN",
    ["SINCE", DateFormat(new Date(Date.now() - 86400000), "MMMM d, yyyy")],
  ],
};

export type ImapMessageAttributes = {
  uid: number; // - A 32-bit ID that uniquely identifies this message within its mailbox.
  flags: string[]; // - A list of flags currently set on this message.
  date: string; // - The internal server date for the message.
  struct?: any[]; // - The message's body structure (only set if requested with fetch()). See below for an explanation of the format of this property.
  size?: number; // - The RFC822 message size (only set if requested with fetch()).
};

export type ImapOnCallbacks = {
  message?: ((message: any, seqno: number, imap: Connection) => void)[];
  messageBody?: ((
    parsed: ParsedMail,
    raw: Source,
    info: any,
    imap: Connection
  ) => void)[];
  messageAttributes?: ((
    attributes: ImapMessageAttributes,
    imap: Connection
  ) => void)[];
  end?: ((imap: Connection) => void)[];
  error?: ((err: any, imap: Connection) => void)[];
};

export function markAsSeen(
  attributes: ImapMessageAttributes,
  imap: Connection
) {
  imap.addFlags(attributes.uid, ["\\Seen"], () => {});
}

export function SimplImap(
  config: ImapConfig,
  actionsOn: ImapOnCallbacks,
  fetchConfig: ImapFetchConfig = DefaultImapFetchConfig
) {
  return new Promise((resolve, reject) => {
    const _config = { ...DefaultImapConfig, ...config };
    const imap = new Connection(_config);
    imap.once("ready", function () {
      console.log("Ready");
      imap.openBox(fetchConfig.box, false, function (err: any, box: any) {
        if (err) {
          imap.end();
          if (err.message !== "Nothing to fetch") {
            reject(err);
          }
        } else {
          imap.search(
            fetchConfig.search,
            function (err: any, messageIds: number[]) {
              if (err) {
                imap.end();
                if (err.message !== "Nothing to fetch") {
                  reject(err);
                }
              } else {
                if (messageIds.length === 0) {
                  imap.end();
                } else {
                  const f = imap.fetch(messageIds, { bodies: "" });
                  f.on("message", function (msg, seqno) {
                    // console.log("Message #%d", seqno);
                    msg.on("body", function (stream: Source, info: any) {
                      // console.log("Body");
                      simpleParser(stream, (err: any, parsed: ParsedMail) => {
                        if (err) {
                          reject(err);
                        }
                        // console.log("Parsed");
                        if (actionsOn.messageBody) {
                          try {
                            actionsOn.messageBody.forEach((cb) =>
                              cb(parsed, stream, info, imap)
                            );
                          } catch (e) {
                            reject(e);
                          }
                        }
                      });
                    });
                    msg.once(
                      "attributes",
                      function (attrs: ImapMessageAttributes) {
                        if (actionsOn.messageAttributes) {
                          try {
                            actionsOn.messageAttributes.forEach((cb) =>
                              cb(attrs, imap)
                            );
                          } catch (e) {
                            reject(e);
                          }
                        }
                      }
                    );
                    if (actionsOn.message) {
                      try {
                        actionsOn.message.forEach((cb) => cb(msg, seqno, imap));
                      } catch (e) {
                        reject(e);
                      }
                    }
                  });
                  f.once("error", function (err) {
                    if (actionsOn.error) {
                      try {
                        actionsOn.error.forEach((cb) => cb(err, imap));
                      } catch (e) {
                        reject(e);
                      }
                    }
                    reject(err);
                  });
                  f.once("end", function () {
                    if (actionsOn.end) {
                      try {
                        actionsOn.end.forEach((cb) => cb(imap));
                      } catch (e) {
                        reject(e);
                      }
                    }
                    imap.end();
                  });
                }
              }
            }
          );
        }
      });
    });

    imap.once("error", function (err: any) {
      console.log("PLOP\n\n\n", err.message, "PLOP\n\n\n");

      if (err.message !== "Nothing to fetch") {
        if (actionsOn.error) {
          try {
            actionsOn.error.forEach((cb) => cb(err, imap));
          } catch (e) {
            reject(e);
          }
        }
      }
    });

    imap.once("end", function () {
      if (actionsOn.end) {
        try {
          actionsOn.end.forEach((cb) => cb(imap));
        } catch (e) {
          reject(e);
        }
      }
      resolve(true);
    });
    imap.on("close", function (hadError: boolean) {
      console.log("Connection closed", hadError ? "with error" : "");
    });

    imap.connect();
    console.log("Connecting...");
  });
}
