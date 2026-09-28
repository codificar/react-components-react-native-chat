import io from "socket.io-client";

export default (WebSocketServer = {
  isConnected: false,
  socket: null,
  interval: null,
  /** @type {Object.<string, number>} channel -> refcount */
  channels: {},

  connect(url) {
    if (this.socket) {
      if (this.socket.disconnected && this.socket.connect) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.channels = this.channels || {};

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
      this.resubscribeAll();
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("WebSocketServer -> Disconnect");
    });

    return this.socket;
  },

  /**
   * Register channel and emit subscribe (or wait for connect).
   * Refcounted so multiple screens can share the same channel.
   */
  subscribeChannel(channel) {
    if (!channel || !this.socket) {
      return;
    }

    this.channels[channel] = (this.channels[channel] || 0) + 1;
    this.emitSubscribe(channel);
  },

  /**
   * Drop one ref; emit unsubscribe when nobody holds the channel.
   */
  unsubscribeChannel(channel) {
    if (!channel || !this.channels[channel]) {
      return;
    }

    this.channels[channel] -= 1;

    if (this.channels[channel] <= 0) {
      delete this.channels[channel];
      if (this.socket && this.socket.connected) {
        this.socket.emit("unsubscribe", { channel });
      }
    }
  },

  emitSubscribe(channel) {
    if (!this.socket || !channel) {
      return;
    }

    if (this.socket.connected) {
      console.log("WebSocketServer -> subscribe", channel);
      this.socket.emit("subscribe", { channel });
      return;
    }

    this.socket.once("connect", () => {
      if (this.channels[channel]) {
        console.log("WebSocketServer -> subscribe (deferred)", channel);
        this.socket.emit("subscribe", { channel });
      }
    });
  },

  resubscribeAll() {
    const channels = Object.keys(this.channels || {});
    channels.forEach((channel) => {
      console.log("WebSocketServer -> Resubscribe", channel);
      this.socket.emit("subscribe", { channel });
    });
  }
});
