(() => {
  function insertStyles() {
    if (document.getElementById('revolve')) return;
    const css = `
      .panel-card.revolve {
        position: relative; /* allow bubble absolute positioning */
        transform-origin: center center;
        animation: revolve-rotate 20s linear infinite;
      }

      @keyframes revolve-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* bubble that sits on the panel image */
      .panel-card .revolve-bubble {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(26,115,232,0.95);
        color: white;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        pointer-events: none;
      }
    `;
    const style = document.createElement('style');
    style.id = 'revolve';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', () => {
    insertStyles();
    const panel = document.querySelector('.panel-card');
    const body = document.querySelector("body");
    const imgs = Array.from(document.querySelectorAll('img'));
    const timeInterval = 50;

    let savedState = localStorage.getItem('panelState');
    let state = savedState ? JSON.parse(savedState) : {
      hue: 0,
      lastUpdate: Date.now()
    };

    const elapsedSeconds = (Date.now() - state.lastUpdate) / 1000;
    const degree = 40; 
    let hue = (state.hue + (elapsedSeconds * degree)) % 360;

    const applyState = (currentHue) => {
      const filter = `hue-rotate(${currentHue}deg) saturate(1.05)`;
      panel.style.filter = filter;
      imgs.forEach(img => { img.style.filter = filter; });
      body.style.background = `linear-gradient(120deg, hsl(${currentHue} 60% 95%), hsl(${(currentHue + 60) % 360} 60% 92%))`;
    };

    applyState(hue);
    panel.classList.add('revolve');

    const interval = setInterval(() => {
      hue = (hue + 2) % 360;
      applyState(hue);

      if (hue % 40 === 0) {
        const newState = {
          hue,
          lastUpdate: Date.now()
        };
        localStorage.setItem('panelState', JSON.stringify(newState));
      }
    }, timeInterval);

    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
      const finalState = {
        hue,
        lastUpdate: Date.now()
      };
      localStorage.setItem('panelState', JSON.stringify(finalState));
    });
  });
})();