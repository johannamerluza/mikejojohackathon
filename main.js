document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#screenshotButton');

  chrome.tabs.captureVisibleTab((url) => {
    const imageDiv = document.querySelector('#image');
    const newImg = document.createElement('img');
    newImg.setAttribute('src', url);
    newImg.setAttribute('id', 'ss');
    // imageDiv.appendChild(newImg);

    var canvas = document.getElementById('canvas');
    canvas.setAttribute('width', 1000);
    canvas.setAttribute('height', 1000);

    var ctx = canvas.getContext('2d');
    var image = new Image();
    image.src = url;
    image.onload = function () {
      // canvas.setAttribute('width', image.width);
      // canvas.setAttribute('height', image.height);
      // canvas.setAttribute('width', 250);
      // canvas.setAttribute('height', 100);
      ctx.drawImage(image, 0, 0);
    };
  });

  button.addEventListener('click', () => {
    const pngUrl = canvas.toDataURL('image/jpeg');
    const prefix = 'data:image/jpeg;base64,';
    const truncatedUrl = pngUrl.slice(prefix.length);

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
        textDiv.innerText = JSON.stringify(text); //JSON.stringify(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  });
});
