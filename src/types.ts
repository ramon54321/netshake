import { NetworkClient, NetworkServer } from "./index";

// -- Messages Example
// type MyMessages = {
//   ClientRequests: {
//     FullState: {
//       Request: { time: number };
//       Response: { gameState: { score: number } };
//     };
//   };
//   ClientPushes: {
//     Status: {
//       score: number;
//     }
//   }
//   ServerRequests: {
//     CameraPosition: {
//       Request: {};
//       Response: { position: number };
//     };
//   };
// };

// TODO: Type the any in the record to the req / res types
export type MessagesBase = {
  ClientRequests: Record<string, any>;
  ClientPushes: Record<string, any>;
  ServerRequests: Record<string, any>;
  ServerPushes: Record<string, any>;
};

export type KeysOfClientRequests<Messages extends MessagesBase> = Exclude<
  keyof Messages["ClientRequests"],
  symbol
>;
export type KeysOfClientPushes<Messages extends MessagesBase> = Exclude<
  keyof Messages["ClientPushes"],
  symbol
>;
export type KeysOfServerRequests<Messages extends MessagesBase> = Exclude<
  keyof Messages["ServerRequests"],
  symbol
>;
export type KeysOfServerPushes<Messages extends MessagesBase> = Exclude<
  keyof Messages["ServerPushes"],
  symbol
>;

export type MessageKindClientRequests<Messages extends MessagesBase> =
  `Client${KeysOfClientRequests<Messages>}Request`;

export type MessageKindClientResponses<Messages extends MessagesBase> =
  `Client${KeysOfClientRequests<Messages>}Response`;

export type MessageKindClientPushes<Messages extends MessagesBase> =
  `Client${KeysOfClientPushes<Messages>}Push`;

export type MessageKindServerRequests<Messages extends MessagesBase> =
  `Server${KeysOfServerRequests<Messages>}Request`;

export type MessageKindServerResponses<Messages extends MessagesBase> =
  `Server${KeysOfServerRequests<Messages>}Response`;

export type MessageKindServerPushes<Messages extends MessagesBase> =
  `Server${KeysOfServerPushes<Messages>}Push`;

export type MessageKindRequests<Messages extends MessagesBase> =
  | MessageKindClientRequests<Messages>
  | MessageKindServerRequests<Messages>;

export type MessageKindResponses<Messages extends MessagesBase> =
  | MessageKindClientResponses<Messages>
  | MessageKindServerResponses<Messages>;

export type MessageKindPushes<Messages extends MessagesBase> =
  | MessageKindClientPushes<Messages>
  | MessageKindServerPushes<Messages>;

export type MessageKind<Messages extends MessagesBase> =
  | MessageKindRequests<Messages>
  | MessageKindResponses<Messages>
  | MessageKindPushes<Messages>;

export type MessageKindToRequest<
  Messages extends MessagesBase,
  K extends MessageKindResponses<Messages>
> = K extends `${infer U}Response`
  ? `${U}Request` extends MessageKindRequests<Messages>
    ? `${U}Request`
    : never
  : never;

export type MessageKindToResponse<
  Messages extends MessagesBase,
  K extends MessageKindRequests<Messages>
> = K extends `${infer U}Request`
  ? `${U}Response` extends MessageKindResponses<Messages>
    ? `${U}Response`
    : never
  : never;

export type MessagePayload<
  Messages extends MessagesBase,
  K extends MessageKind<Messages>
> = K extends `${"Client" | "Server"}${infer U}${"Push"}`
  ? K extends `${infer S}${U}${"Push"}`
    ? `${S}Pushes` extends keyof Messages
      ? U extends keyof Messages[`${S}Pushes`]
        ? Messages[`${S}Pushes`][U]
        : never
      : never
    : never
  : K extends `${"Client" | "Server"}${infer U}${"Request" | "Response"}`
  ? K extends `${"Client" | "Server"}${U}${infer R}`
    ? R extends "Request" | "Response"
      ? U extends keyof Messages["ClientRequests"]
        ? Messages["ClientRequests"][U][R]
        : U extends keyof Messages["ServerRequests"]
        ? Messages["ServerRequests"][U][R]
        : never
      : never
    : any
  : never;

export type MessageRequest<
  Messages extends MessagesBase,
  K extends MessageKindRequests<Messages>
> = {
  kind: K;
  id: string;
  payload: MessagePayload<Messages, K>;
};
export type MessageResponse<
  Messages extends MessagesBase,
  K extends MessageKindResponses<Messages>
> = {
  kind: K;
  id: string;
  responseTo: string;
  payload: MessagePayload<Messages, K>;
};
export type MessagePush<
  Messages extends MessagesBase,
  K extends MessageKindPushes<Messages>
> = {
  kind: K;
  id: string;
  payload: MessagePayload<Messages, K>;
};

export type Message<
  Messages extends MessagesBase,
  K extends MessageKind<Messages>
> = K extends MessageKindRequests<Messages>
  ? MessageRequest<Messages, K>
  : K extends MessageKindResponses<Messages>
  ? MessageResponse<Messages, K>
  : K extends MessageKindPushes<Messages>
  ? MessagePush<Messages, K>
  : never;

export type MessageUnknown<Messages extends MessagesBase> =
  | MessageResponse<Messages, any>
  | MessageRequest<Messages, any>
  | MessagePush<Messages, any>;

export type HandlersServer<Messages extends MessagesBase, MessageMeta> = {
  [K in
    | MessageKindClientRequests<Messages>
    | MessageKindClientPushes<Messages>]: (
    network: NetworkServer<Messages, MessageMeta>,
    meta: MessageMeta,
    message: Message<Messages, K>
  ) => void;
};

export type HandlersClient<Messages extends MessagesBase, MessageMeta> = {
  [K in
    | MessageKindServerRequests<Messages>
    | MessageKindServerPushes<Messages>]: (
    network: NetworkClient<Messages, MessageMeta>,
    meta: MessageMeta,
    message: Message<Messages, K>
  ) => void;
};
