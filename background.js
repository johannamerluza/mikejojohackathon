chrome.browserAction.onClicked.addListener(function (tab) {
  // chrome.desktopCapture.chooseDesktopMedia(
  //   ['screen', 'window', 'tab'],
  //   tab,
  //   (streamId) => {
  //     //check whether the user canceled the request or not
  //     if (streamId && streamId.length) {
  //     }
  //   }
  // );
  chrome.tabs.captureVisibleTab((url) => {
    console.log(url);
  });
});
