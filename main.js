const runCode = function (codeStr) {
  const _stdOut = [];
  const _stdErr = [];
  const _rn = [];
  const logOld = console.log;
  console.log = function (...e) {
    _stdOut.push(e);
  };
  try {
    _rn.push(eval(codeStr));
  } catch (e) {
    _stdErr.push(e.message);
  }
  console.log = logOld;
  return {
    stdOut: _stdOut,
    stderr: _stdErr,
    rn: _rn,
  };
};

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas'); // where the raw screenshot goes
  const croppedCanvas = document.getElementById('canvas-cropped'); // where the cropped screenshot goes, hidden so the user can't see
  // text box where the ocr results
  const codemirror = CodeMirror(document.querySelector('#text-editor'), {
    lineNumbers: true,
    tabSize: 2,
    value: 'console.log("Hello, World");',
    mode: 'javascript',
    theme: 'monokai',
  });
  codemirror.setSize(600, 400);
  // text box where the standard output goes
  const stdout = CodeMirror(document.querySelector('#text-editor'), {
    lineNumbers: true,
    tabSize: 2,
    value: 'standard out here',
    mode: 'javascript',
    theme: 'monokai',
  });
  stdout.setSize(600, 200);

  // button that runs the code
  const button = document.getElementById('runCode');
  button.addEventListener('click', () => {
    const str = codemirror.getValue();
    const res = runCode(str);
    let out = '';
    for (let stdout of res['stdOut']) out += stdout + '\n';
    for (let stderr of res['stderr']) out += stderr + '\n';
    out = out.slice(0, out.length - 1); // remove last \n
    stdout.setValue(out);
  });

  document.getElementById('text-editor').style.display = 'none';

  // state variables for cropping box
  let isDrawing = false;
  let startX;
  let startY;

  chrome.tabs.captureVisibleTab((url) => {
    const imageDiv = document.querySelector('#image'); // TODO: delete me
    const newImg = document.createElement('img');
    newImg.setAttribute('src', url);
    newImg.setAttribute('id', 'ss');
    // imageDiv.appendChild(newImg);

    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = url;
    let ratio = undefined;

    image.onload = function () {
      // draws image onto canvas resized to fit within 800x600
      canvas.width = 800;
      canvas.height = 600;
      const hRatio = canvas.width / image.width;
      const vRatio = canvas.height / image.height;
      ratio = Math.min(hRatio, vRatio);
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        image.width * ratio,
        image.height * ratio
      );
      // canvas.setAttribute('width', image.width);
      // canvas.setAttribute('height', image.height);
      // ctx.drawImage(image, 0, 0);
    };

    canvas.addEventListener(
      'click',
      function (event) {
        var rect = canvas.getBoundingClientRect(); // TODO: remove
        var mouseX = event.clientX - rect.left;
        var mouseY = event.clientY - rect.top;

        if (isDrawing) {
          isDrawing = false;
          ctx.beginPath(); // TODO: remove
          ctx.rect(startX, startY, mouseX - startX, mouseY - startY); // TODO: remove
          const [x1, y1, dx, dy] = [
            startX / ratio,
            startY / ratio,
            (mouseX - startX) / ratio,
            (mouseY - startY) / ratio,
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
        // const textDiv = document.querySelector('#text');
        // textDiv.innerText = JSON.stringify(text); //JSON.stringify(response);
        codemirror.setValue(text);
        document.getElementById('canvas').remove();
        document.getElementById('text-editor').style.display = ''; // unhides the code editor
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});
