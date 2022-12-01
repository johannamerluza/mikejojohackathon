document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#screenshotButton');
  const canvas = document.getElementById('canvas');
  const croppedCanvas = document.getElementById('canvas-cropped');
  const codemirror = CodeMirror(document.querySelector('#text-editor'), {
    lineNumbers: true,
    tabSize: 2,
    value: 'console.log("Hello, World");',
    mode: 'javascript',
    theme: 'monokai',
  });

  var isDrawing = false;
  var startX;
  var startY;

  chrome.tabs.captureVisibleTab((url) => {
    const imageDiv = document.querySelector('#image');
    const newImg = document.createElement('img');
    newImg.setAttribute('src', url);
    newImg.setAttribute('id', 'ss');
    // imageDiv.appendChild(newImg);

    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = url;
    image.onload = function () {
      canvas.setAttribute('width', image.width);
      canvas.setAttribute('height', image.height);
      ctx.drawImage(image, 0, 0);
    };

    canvas.addEventListener(
      'click',
      function (event) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = event.clientX - rect.left;
        var mouseY = event.clientY - rect.top;

        if (isDrawing) {
          isDrawing = false;
          ctx.beginPath();
          ctx.rect(startX, startY, mouseX - startX, mouseY - startY);
          const [x1, y1, dx, dy] = [
            startX,
            startY,
            mouseX - startX,
            mouseY - startY,
          ];

          const ctx2 = croppedCanvas.getContext('2d');
          const image2 = new Image();
          image2.src = url;
          image2.onload = function () {
            croppedCanvas.setAttribute('width', dx);
            croppedCanvas.setAttribute('height', dy);
            ctx2.drawImage(image, -x1, -y1);
            runOCR();
          };
          canvas.style.cursor = 'default';
        } else {
          isDrawing = true;
          startX = mouseX;
          startY = mouseY;
          canvas.style.cursor = 'crosshair';
        }
      },
      false
    );
  });

  function runOCR() {
    const pngUrl = croppedCanvas.toDataURL('image/jpeg');
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
        codemirror.setValue(text);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  // button.addEventListener('click', () => {});
});
