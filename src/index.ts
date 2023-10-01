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
  isResponseMessage,
  HandlersClient,
  HandlersServer,
  MessageKindServerRequests,
  MessageKindServerResponses,
  MessageKindClientRequests,
  MessageKindClientResponses,
} from "./types";
export type { HandlersClient, HandlersServer } from "./types";

// type MyMessages = {
//   ClientRequests: {
//     FullState: {
//       Request: { age: number };
//       Response: { gameState: { score: number } };
//     };
//   };
//   ServerRequests: {
//     CameraPosition: {
//       Request: {};
//       Response: { position: number };
//     };
//   };
// };

class Network<
  Messages extends MessagesBase,
  Handlers extends HandlersClient<Messages> | HandlersServer<Messages>,
  MessageKindRequestsNetwork extends MessageKindRequests<Messages>,
  MessageKindResponsesNetwork extends MessageKindResponses<Messages>
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

  handleMessage(meta: any, messageString: string) {
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

    // -- Not a response to a request, handle as command
    const handler = (this.handlers as any)[message.kind];
    if (isNil(handler)) {
      return console.warn(`Unknown handler: ${message.kind}`);
    }
    handler(meta, message as any);
  }

  async sendRequest<K extends MessageKindRequests<Messages>>(
    socket: { sendUTF: (message: string) => any },
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
    socket.sendUTF(JSON.stringify(message));
    return resultPromise;
  }
}

export class NetworkClient<Messages extends MessagesBase> extends Network<
  Messages,
  HandlersClient<Messages>,
  MessageKindClientRequests<Messages>,
  MessageKindServerResponses<Messages>
> {}

export class NetworkServer<Messages extends MessagesBase> extends Network<
  Messages,
  HandlersServer<Messages>,
  MessageKindServerRequests<Messages>,
  MessageKindClientResponses<Messages>
> {}
