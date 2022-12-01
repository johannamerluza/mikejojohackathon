document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#screenshotButton');
  button.addEventListener('click', (tab) => {
    chrome.tabs.captureVisibleTab((url) => {
      //console.log(url);
      const imageDiv = document.querySelector('#image');
      const newImg = document.createElement('img');
      newImg.setAttribute('src', url);
      newImg.setAttribute('id', 'ss');
      imageDiv.appendChild(newImg);

      const prefix = 'data:image/jpeg;base64,';
      const truncatedUrl = url.slice(prefix.length);

      const payload = {
        requests: [
          {
            image: {
              content: truncatedUrl,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                model: 'builtin/latest',
              },
            ],
          },
        ],
      };

      axios
        .post(
          `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
          payload
        )
        .then(function (response) {
          const data = response.data.responses[0];
          const text = data.fullTextAnnotation.text;
          const textDiv = document.querySelector('#text');
          textDiv.innerText = JSON.stringify(text);
        })
        .catch(function (error) {
          console.log(error);
        });
    });
  });
});
