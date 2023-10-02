import { NetworkClient, NetworkServer } from "../index";
import { HandlersClient, HandlersServer } from "../types";

type Messages = {
  ServerRequests: {
    Username: {
      Request: {};
      Response: { username: string };
    };
  };
  ClientRequests: {};
};

describe("Simple local client and server", () => {
  it("Should request and respond correctly", async () => {
    // -- Prepare server
    const serverHandlers: HandlersServer<Messages, any> = {};
    const serverNetwork = new NetworkServer<Messages, any>(serverHandlers);

    // -- Prepare client
    const clientHandlers: HandlersClient<Messages, any> = {
      ServerUsernameRequest: (network, _meta, message) => {
        const responseMessage = network.createResponseMessage(
          "ServerUsernameResponse",
          message.id,
          {
            username: "Jamie Fraser",
          }
        );
        network.sendResponse(
          {
            send: (message: string) => serverNetwork.handleMessage({}, message),
          },
          responseMessage
        );
      },
    };
    const clientNetwork = new NetworkClient<Messages, any>(clientHandlers);

    // -- Prepare server to client request message
    const serverRequestMessage = serverNetwork.createRequestMessage(
      "ServerUsernameRequest",
      {}
    );

    // -- Send request from server to client and wait for client response
    const result = await serverNetwork.sendRequest(
      { send: (message: string) => clientNetwork.handleMessage({}, message) },
      serverRequestMessage
    );

    expect(result.payload).toStrictEqual({ username: "Jamie Fraser" });
  });
});
