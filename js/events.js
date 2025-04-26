// 마우스 이벤트 핸들러
function handleMouseDown(e) {
  // 터치 이벤트인지 확인 (터치 기기에서는 마우스 이벤트도 동시에 발생할 수 있음)
  if (e.type === 'touchstart') return;
  
  isDrawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
  
  points = [];
  points.push({ x: startX, y: startY });
  
  // 현재 그리기 상태 설정
  currentDrawingState = {
    type: currentTool,
    color: currentColor,
    lineWidth: currentLineWidth,
    points: points,
    memo: document.getElementById('memo').value
  };
  
  if (currentTool === 'pencil-tool' || currentTool === 'curve-tool') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
}

function handleMouseMove(e) {
  if (!isDrawing) return;
  
  const x = e.offsetX;
  const y = e.offsetY;
  
  if (currentTool === 'pencil-tool') {
    // 먼저 흰색 테두리 그리기
    ctx.strokeStyle = 'white';
    ctx.lineWidth = currentLineWidth + 2;
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // 실제 색상으로 그리기
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
    
    points.push({ x, y });
  } else if (currentTool === 'curve-tool') {
    points.push({ x, y });
    
    // 일시적으로 곡선 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawCanvas();
    
    // 흰색 테두리 곡선 그리기
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = currentLineWidth + 2;
    ctx.stroke();
    
    // 실제 색상 곡선 그리기
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.stroke();
  } else {
    // 일시적으로 미리보기 그리기
    redrawCanvas();
    
    if (currentTool === 'line-tool') {
      // 흰색 테두리 선 그리기
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = currentLineWidth + 2;
      ctx.stroke();
      
      // 실제 색상 선 그리기
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentLineWidth;
      ctx.stroke();
    } else if (currentTool === 'arrow-tool') {
      drawArrowWithOutline(startX, startY, x, y, currentColor, currentLineWidth);
    }
  }
}

function handleMouseUp(e) {
  if (!isDrawing) return;
  
  const x = e.offsetX;
  const y = e.offsetY;
  
  if (currentTool === 'line-tool' || currentTool === 'arrow-tool') {
    points.push({ x, y });
  }
  
  // 그리기 히스토리에 추가
  if (currentDrawingState) {
    drawingHistory.push(currentDrawingState);
  }
  
  isDrawing = false;
  redrawCanvas();
}

function handleMouseOut() {
  if (isDrawing && currentDrawingState) {
    drawingHistory.push(currentDrawingState);
  }
  
  isDrawing = false;
  redrawCanvas();
}

// 터치 이벤트 핸들러
function handleTouchStart(e) {
  if (e.cancelable) {
    e.preventDefault();
  }
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  
  // 스크롤 위치 고려한 좌표 계산 (모바일에서 정확도 향상)
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  isDrawing = true;
  startX = x;
  startY = y;
  
  points = [];
  points.push({ x, y });
  
  currentDrawingState = {
    type: currentTool,
    color: currentColor,
    lineWidth: currentLineWidth,
    points: points,
    memo: document.getElementById('memo').value
  };
  
  if (currentTool === 'pencil-tool' || currentTool === 'curve-tool') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
}

function handleTouchMove(e) {
  if (e.cancelable) {
    e.preventDefault();
  }
  
  if (!isDrawing) return;
  
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  
  // 스크롤 위치 고려한 좌표 계산 (모바일에서 정확도 향상)
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  if (currentTool === 'pencil-tool') {
    // 먼저 흰색 테두리 그리기
    ctx.strokeStyle = 'white';
    ctx.lineWidth = currentLineWidth + 2;
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // 실제 색상으로 그리기
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
    
    points.push({ x, y });
  } else if (currentTool === 'curve-tool') {
    points.push({ x, y });
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawCanvas();
    
    // 흰색 테두리 곡선 그리기
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = currentLineWidth + 2;
    ctx.stroke();
    
    // 실제 색상 곡선 그리기
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.stroke();
  } else {
    redrawCanvas();
    
    if (currentTool === 'line-tool') {
      // 흰색 테두리 선 그리기
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = currentLineWidth + 2;
      ctx.stroke();
      
      // 실제 색상 선 그리기
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentLineWidth;
      ctx.stroke();
    } else if (currentTool === 'arrow-tool') {
      drawArrowWithOutline(startX, startY, x, y, currentColor, currentLineWidth);
    }
  }
}

function handleTouchEnd(e) {
  if (e.cancelable) {
    e.preventDefault();
  }
  
  if (!isDrawing) return;
  
  if (currentTool === 'line-tool' || currentTool === 'arrow-tool') {
    const lastTouch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const x = lastTouch.clientX - rect.left;
    const y = lastTouch.clientY - rect.top;
    
    points.push({ x, y });
  }
  
  if (currentDrawingState) {
    drawingHistory.push(currentDrawingState);
  }
  
  isDrawing = false;
  redrawCanvas();
}