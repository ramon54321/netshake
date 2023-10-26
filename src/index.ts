import { isNil, isNotNil } from "ramda";
import { v4 as uuidv4 } from "uuid";
import {
  Message,
  MessageKindRequests,
  MessageKindToResponse,
  MessagePayload,
  MessagesBase,
  MessageUnknown,
  MessageKindResponses,
  MessageKindPushes,
  HandlersClient,
  HandlersServer,
  MessageKindServerRequests,
  MessageKindServerResponses,
  MessageKindClientRequests,
  MessageKindClientResponses,
  MessageResponse,
  MessageKindClientPushes,
  MessageKindServerPushes,
} from "./types";
export type {
  HandlersClient,
  HandlersServer,
  MessageRequest,
  MessageResponse,
  MessagePush,
  MessageUnknown,
} from "./types";

export function isResponseMessage<Messages extends MessagesBase>(
  message: MessageUnknown<Messages>
): message is MessageResponse<Messages, any> {
  return isNotNil((message as MessageResponse<Messages, any>).responseTo);
}

class Network<
  Messages extends MessagesBase,
  MessageMeta,
  Handlers extends
    | HandlersClient<Messages, MessageMeta>
    | HandlersServer<Messages, MessageMeta>,
  MessageKindRequestsNetwork extends MessageKindRequests<Messages>,
  MessageKindResponsesNetwork extends MessageKindResponses<Messages>,
  MessageKindPushesNetwork extends MessageKindPushes<Messages>
> {
  private handlers: Handlers;
  private responseTable: Record<string, (message: any) => any> = {};

  constructor(handlers: any) {
    this.handlers = handlers;
  }

  createRequestMessage<K extends MessageKindRequestsNetwork>(
    kind: K,
    payload: MessagePayload<Messages, K>
  ): Message<Messages, K> {
    const message = {
      kind,
      id: uuidv4(),
      payload,
    };
    return message as Message<Messages, K>;
  }

  createResponseMessage<K extends MessageKindResponsesNetwork>(
    kind: K,
    responseTo: string,
    payload: MessagePayload<Messages, K>
  ): Message<Messages, K> {
    const message = {
      kind,
      id: uuidv4(),
      payload,
      responseTo,
    };
    return message as Message<Messages, K>;
  }

  createPushMessage<K extends MessageKindPushesNetwork>(
    kind: K,
    payload: MessagePayload<Messages, K>
  ): Message<Messages, K> {
    const message = {
      kind,
      id: uuidv4(),
      payload,
    };
    return message as Message<Messages, K>;
  }

  handleMessage(meta: MessageMeta, messageString: string) {
    const message: MessageUnknown<Messages> = JSON.parse(messageString);

    // -- Check if this message is a response to a pending request
    if (
      isResponseMessage(message) &&
      isNotNil(this.responseTable[message.responseTo])
    ) {
      this.responseTable[message.responseTo](message);
      delete this.responseTable[message.responseTo];
      return;
    }

    // -- Not a response to a request, handle as push
    const handler = (this.handlers as any)[message.kind];
    if (isNil(handler)) {
      return console.warn(`Unknown handler: ${message.kind}`);
    }
    handler(this, meta, message as any);
  }

  async sendRequest<K extends MessageKindRequestsNetwork>(
    socket: { send: (message: string) => any },
    message: Message<Messages, K>
  ): Promise<Message<Messages, MessageKindToResponse<Messages, K>>> {
    const resultPromise = new Promise<
      Message<Messages, MessageKindToResponse<Messages, K>>
    >((resolve) => {
      this.responseTable[message.id] = (
        response: Message<Messages, MessageKindToResponse<Messages, K>>
      ) => {
        resolve(response);
      };
    });
    socket.send(JSON.stringify(message));
    return resultPromise;
  }

  async sendResponse<K extends MessageKindResponsesNetwork>(
    sender: { send: (message: string) => any },
    message: Message<Messages, K>
  ) {
    sender.send(JSON.stringify(message));
  }

  async sendPush<K extends MessageKindPushesNetwork>(
    sender: { send: (message: string) => any },
    message: Message<Messages, K>
  ) {
    sender.send(JSON.stringify(message));
  }
}

export class NetworkClient<
  Messages extends MessagesBase,
  MessageMeta
> extends Network<
  Messages,
  MessageMeta,
  HandlersClient<Messages, MessageMeta>,
  MessageKindClientRequests<Messages>,
  MessageKindServerResponses<Messages>,
  MessageKindClientPushes<Messages>
> {}

export class NetworkServer<
  Messages extends MessagesBase,
  MessageMeta
> extends Network<
  Messages,
  MessageMeta,
  HandlersServer<Messages, MessageMeta>,
  MessageKindServerRequests<Messages>,
  MessageKindClientResponses<Messages>,
  MessageKindServerPushes<Messages>
> {}
