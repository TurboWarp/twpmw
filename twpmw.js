class TWPMW {
  constructor(iframe) {
    this.iframe = iframe;
    window.addEventListener('message', this.handleMessage.bind(this));
    this.ready = false;
    this.callbacks = new Map();
    this.callbackId = 0;
    this.queue = [];
  }

  handleMessage(e) {
    const data = e.data;

    const type = data.type;
    if (type === "start") {
      this.ready = true;
      for (const queuedMessage of this.queue) {
        this.postMessage(queuedMessage);
      }
      this.queue = [];
    } else if (type === "response") {
      const inResponseTo = data.inResponseTo;
      const id = inResponseTo._id;
      const callback = this.callbacks.get(id);
      if (callback) {
        callback(data);
      }
      this.callbacks.delete(id);
    }
  }

  postMessage(obj) {
    if (!this.ready) {
      this.queue.push(obj);
      return;
    }
    this.iframe.contentWindow.postMessage(obj, '*');
  }

  postMessageAndAwaitResponse(obj) {
    return new Promise((resolve, reject) => {
      const id = this.callbackId++;
      const callback = (message) => {
        resolve(message);
      };
      this.callbacks.set(id, callback);
      this.postMessage({
        _id: id,
        ...obj
      });
    });
  }

  async get(name) {
    const response = await this.postMessageAndAwaitResponse({
      type: 'get',
      name
    });
    return response.value;
  }

  async set(name, value) {
    await this.postMessageAndAwaitResponse({
      type: 'set',
      name,
      value
    });
  }
}
