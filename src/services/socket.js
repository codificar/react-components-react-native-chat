import io from "socket.io-client";
import _ from "lodash";

export default (WebSocketServer = {
  isConnected: false,
  socket: null,
  interval: null,
  connect(url) {

    this.socket = io.connect(
      url,
      {
        pingInterval: 20000,
        pingTimeout: 2 * 20000,
        transports: ["websocket"],
        reconnection: true
      }
    );

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("WebSocketServer -> Connect");
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("WebSocketServer -> Disconnect");
    });

    return this.socket;
  }
});