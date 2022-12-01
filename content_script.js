// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureVisibleTab

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (message.name === 'stream' && message.streamId) {
    let track, canvas;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: message.streamId,
          },
        },
      })
      .then((stream) => {});
  }
});
