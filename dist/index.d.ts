import { ParsedMail as _ParsedMail, Source } from "mailparser";
import Connection, { Config } from "imap";
export type ParsedMail = _ParsedMail;
export type ImapConfig = {
    user: string;
    password: string;
    host: string;
} & Partial<Config>;
export declare const DefaultImapConfig: Partial<Config>;
export type ImapFetchConfig = {
    box: string;
    readonly: boolean;
    search: string[] | string[][] | (string | string[])[];
};
export declare const DefaultImapFetchConfig: ImapFetchConfig;
export type ImapMessageAttributes = {
    uid: number;
    flags: string[];
    date: string;
    struct?: any[];
    size?: number;
};
export type ImapOnCallbacks = {
    message?: ((message: any, seqno: number, imap: Connection) => void)[];
    messageBody?: ((parsed: ParsedMail, raw: Source, info: any, imap: Connection) => void)[];
    messageAttributes?: ((attributes: ImapMessageAttributes, imap: Connection) => void)[];
    end?: ((imap: Connection) => void)[];
    error?: ((err: any, imap: Connection) => void)[];
};
export declare function markAsSeen(attributes: ImapMessageAttributes, imap: Connection): void;
export declare function SimplImap(config: ImapConfig, actionsOn: ImapOnCallbacks, fetchConfig?: ImapFetchConfig): Promise<unknown>;
