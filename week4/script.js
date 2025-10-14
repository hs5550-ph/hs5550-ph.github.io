(function () {
    const video = document.getElementById('camera');
    let currentStream = null;

    async function startCamera() {
      try {
        const constraints = { video: { facingMode: 'user' } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        currentStream = stream;
      } catch (error) {
        console.error('Camera start failed:', error);
      }
    }
    
    startCamera();
})();