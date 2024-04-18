# SimplImap

A very basic wrapper around node-imap (@lovely-inbox/imap rewritte actually).

It will execute specified callbacks on specific events when fetching messages with IMAP while avoiding (as much as possible) the spaggethi code :D

## TLDR

```typescript
import { SimplImap, markAaSeen } from "simplimap";

const config = {
  user: "my-email@my-domain.com",
  password: "5UchA57rongANDbeau7ifulPA55",
  host: "imap.my-domain.com",
}

const callbacksOn = {
  // message: [(message: any, seqno: number, imap: Connection) => {
  //   console.log(message, seqno, imap);
  // }],
  messageBody: [
    (parsed: ParsedMail, raw: Source, info: any, imap: Connection) => {
      console.log(parsed, raw, info, imap)
    }
  ]
  messageAttributes: [
    markAaSeen
  ]
  // end?: ((imap: Connection) => void)[];
  error: [
    (err: any, imap: Connection) => {
      console.log(err, imap)
    }
  ]
}

await SimplImap(config, callbacksOn);
// voila

```

## Opinions

Oh it's opinionated alright !

I used node-imap and nodemailer SimpleParser to get email body e.a.s.i.l.y ...

No fancy low level whatever, it just fetches messages you tell it to and executes callbacks you specified for a Narrow subset of the IMAP spec.

Now, I'm open for inputs if you have ideas on specific process/callbacks you'd like in SimplImap.

the only things on the roadmap are a bit of clean up (tame the spaghetti callback beast) and attachements, soon(tm).

## Why ?

I probably am going to have this code in a bunch of projects so it eases my maintainance process ;) (smart, not hard !)
