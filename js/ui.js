// 전체화면 모드 토글
function toggleFullscreen() {
  const body = document.body;
  
  if (!isFullscreen) {
    // 전체화면 모드 켜기
    body.classList.add('fullscreen-mode');
    
    // 전체화면 나가기 버튼 추가
    const exitBtn = document.createElement('button');
    exitBtn.className = 'exit-fullscreen';
    exitBtn.innerHTML = '<i class="material-icons">fullscreen_exit</i>';
    exitBtn.addEventListener('click', toggleFullscreen);
    document.body.appendChild(exitBtn);
    
    isFullscreen = true;
  } else {
    // 전체화면 모드 끄기
    body.classList.remove('fullscreen-mode');
    
    // 전체화면 나가기 버튼 제거
    const exitBtn = document.querySelector('.exit-fullscreen');
    if (exitBtn) exitBtn.remove();
    
    isFullscreen = false;
  }
  
  // 캔버스 크기 다시 계산
  setTimeout(resizeCanvas, 100);
}

// 모바일에서 도구 패널 토글
function toggleToolsPanel() {
  const toolsPanel = document.querySelector('.tools-panel');
  const toggleBtn = document.getElementById('toggle-panel-btn');
  toolsPanel.classList.toggle('collapsed');
  
  // 아이콘 변경
  if (toolsPanel.classList.contains('collapsed')) {
    toggleBtn.querySelector('i').textContent = 'menu';
  } else {
    toggleBtn.querySelector('i').textContent = 'close';
  }
  
  // 토글 후 캔버스 크기 다시 계산
  setTimeout(resizeCanvas, 100);
}

// 캔버스 지우기
function clearCanvas() {
  drawingHistory = [];
  redrawCanvas();
}

// 실행 취소
function undoLastAction() {
  if (drawingHistory.length > 0) {
    drawingHistory.pop();
    redrawCanvas();
  }
}

// 캔버스 저장
function saveCanvas() {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    
    link.href = dataUrl;
    link.download = `포더보컬_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    
    // 모바일에서 저장 확인 메시지
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      alert('이미지가 저장되었습니다. 다운로드 폴더를 확인하세요.');
    }
  } catch (err) {
    alert('이미지 저장 중 오류가 발생했습니다: ' + err.message);
  }
}

// 이미지만 다운로드
function downloadCanvasImage() {
  // 이미지 다운로드를 위한 임시 캔버스 생성
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // 배경 이미지 그리기 - 비율 유지
  if (backgroundImages[currentBackground] && bgImg.complete) {
    const imgRatio = bgImg.width / bgImg.height;
    const canvasRatio = tempCanvas.width / tempCanvas.height;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgRatio > canvasRatio) {
      drawHeight = tempCanvas.height;
      drawWidth = drawHeight * imgRatio;
      offsetX = (tempCanvas.width - drawWidth) / 2;
    } else {
      drawWidth = tempCanvas.width;
      drawHeight = drawWidth / imgRatio;
      offsetY = (tempCanvas.height - drawHeight) / 2;
    }
    
    tempCtx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
  } else {
    // 배경이 없으면 연한 그레이 배경 (배경 없음 옵션 삭제로 이 코드는 실행되지 않음)
    tempCtx.fillStyle = '#f8f8f8';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  }
  
  // 그리기 히스토리 다시 그리기
  drawingHistory.forEach(state => {
    // 임시적으로 그리기 상태를 임시 캔버스에 그리기 위한 기존 컨텍스트 저장
    const originalContext = ctx;
    ctx = tempCtx;
    drawFromState(state);
    ctx = originalContext;
  });
  
  // 상황 명칭을 캠버스 상단에 그리기
  if (currentSituation) {
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    tempCtx.fillRect(10, 10, tempCtx.measureText(currentSituation).width + 20, 30);
    tempCtx.font = 'bold 14px Noto Sans KR';
    tempCtx.fillStyle = 'white';
    tempCtx.fillText(currentSituation, 20, 30);
  }
  
  // 이미지로 다운로드
  const imageUrl = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  
  link.href = imageUrl;
  link.download = `포더보컬_이미지_${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
}