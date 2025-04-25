// 초기화 함수
function init() {
  resizeCanvas();
  
  // 툴 버튼 이벤트 리스너
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelector('.tool-btn.active').classList.remove('active');
      this.classList.add('active');
      currentTool = this.id;
    });
  });
  
  // 색상 선택 이벤트 리스너
  document.querySelectorAll('.color-option').forEach(color => {
    color.addEventListener('click', function() {
      document.querySelector('.color-option.active').classList.remove('active');
      this.classList.add('active');
      currentColor = this.dataset.color;
    });
  });
  
  // 배경 이미지 이벤트 리스너
  document.getElementById('background-image').addEventListener('change', function() {
    currentBackground = this.value;
    if (backgroundImages[currentBackground]) {
      console.log('배경 이미지 로드 시도:', backgroundImages[currentBackground]);
      bgImg.src = backgroundImages[currentBackground];
      bgImg.onload = function() {
        console.log('이미지 로드 완료');
        redrawCanvas();
      };
      bgImg.onerror = function() {
        console.error('이미지 로드 실패:', backgroundImages[currentBackground]);
      };
    } else {
      redrawCanvas();
    }
  });
  
  // 상황 명칭 이벤트 리스너
  document.getElementById('situation-title').addEventListener('input', function() {
    currentSituation = this.value;
    updateSituationDisplay();
  });
  
  // 버튼 이벤트 리스너
  document.getElementById('clear-btn').addEventListener('click', clearCanvas);
  document.getElementById('undo-btn').addEventListener('click', undoLastAction);
  document.getElementById('save-btn').addEventListener('click', saveCanvas);
  document.getElementById('download-img-btn').addEventListener('click', downloadCanvasImage);
  document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
  document.getElementById('toggle-panel-btn').addEventListener('click', toggleToolsPanel);
  
  // 캔버스 이벤트 리스너
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseout', handleMouseOut);
  
  // 터치 이벤트 지원
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // 핀치 줌 방지 (iOS Safari)
  document.addEventListener('gesturestart', function(e) {
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturechange', function(e) {
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  
  // 윈도우 리사이즈 이벤트
  window.addEventListener('resize', resizeCanvas);
  
  // 초기 캔버스 설정
  clearCanvas();
}

// 페이지 로드 시 초기화
window.addEventListener('load', init);