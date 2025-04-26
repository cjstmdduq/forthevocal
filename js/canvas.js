// 캔버스 및 컨텍스트 가져오기
const canvas = document.getElementById('vocalCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
function resizeCanvas() {
  const container = document.querySelector('.canvas-container');
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // 모바일 환경인지 확인
  const isMobile = window.innerWidth <= 768;
  
  // 캔버스 디스플레이 크기 설정
  if (isMobile) {
    const size = Math.min(410, container.clientWidth);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    // 캔버스 버퍼 크기 설정
    canvas.width = size;
    canvas.height = size;
  } else {
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    
    // PC에서는 기존대로 devicePixelRatio 적용
    canvas.width = container.clientWidth * devicePixelRatio;
    canvas.height = container.clientHeight * devicePixelRatio;
    
    // 컨텍스트 스케일 조정
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  
  redrawCanvas();
}

// 이미지 배경
const backgroundImages = {
  vocal_cords: 'img/vocal_cords.webp',
  facial_view: 'img/vocal_anatomy_facial_view.webp',
  full_body_view: 'img/vocal_anatomy_full_body_view.webp',
  frontal_facial_view: 'img/Vocal Anatomy – Frontal Facial View.webp',
  transparent_thoracic_view: 'img/Vocal Anatomy – Transparent Thoracic View.webp'
};

// 배경 이미지 객체
const bgImg = new Image();

// 상태 변수
let isDrawing = false;
let currentTool = 'pencil-tool';
let currentColor = '#ff6b6b';
let currentLineWidth = 1; // 고정 1px 선 굵기 사용
let currentBackground = 'none';
let currentSituation = '';
let startX, startY;
let points = []; // 곡선을 위한 점들
let drawingHistory = [];
let currentDrawingState = null;

// 전체화면 모드 토글
let isFullscreen = false;

// 캔버스 다시 그리기
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 배경 이미지 그리기 - 비율 유지
  if (backgroundImages[currentBackground] && bgImg.complete) {
    const imgRatio = bgImg.width / bgImg.height;
    const canvasRatio = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgRatio > canvasRatio) {
      // 이미지가 캔버스보다 더 가로로 긴 경우
      drawHeight = canvas.height;
      drawWidth = drawHeight * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    } else {
      // 이미지가 캔버스보다 더 세로로 긴 경우
      drawWidth = canvas.width;
      drawHeight = drawWidth / imgRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    }
    
    ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
  }
  
  // 그리기 히스토리 다시 그리기
  drawingHistory.forEach(state => {
    drawFromState(state);
  });
  
  // 상황 명칭 표시 업데이트
  updateSituationDisplay();
}

// 상황 명칭 표시 업데이트
function updateSituationDisplay() {
  const situationDisplay = document.getElementById('situation-display');
  if (currentSituation) {
    situationDisplay.textContent = currentSituation;
    situationDisplay.style.display = 'block';
  } else {
    situationDisplay.style.display = 'none';
  }
}

// 상태에서 그리기
function drawFromState(state) {
  const { type, color, lineWidth, points, memo } = state;
  
  // 흰색 테두리를 위한 설정
  function drawWithWhiteOutline(drawFunction) {
    // 먼저 흰색 테두리 그리기
    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidth + 2; // 테두리 굵기 감소
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawFunction();
    
    // 그 위에 실제 색상으로 그리기
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    drawFunction();
  }
  
  switch (type) {
    case 'pencil-tool':
      drawWithWhiteOutline(() => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
      });
      break;
      
    case 'line-tool':
      drawWithWhiteOutline(() => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
      });
      break;
      
    case 'curve-tool':
      drawWithWhiteOutline(() => {
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
        
        ctx.stroke();
      });
      break;
      
    case 'arrow-tool':
      drawArrowWithOutline(points[0].x, points[0].y, points[1].x, points[1].y, color, lineWidth);
      break;
  }
  
  // 메모 그리기
  if (memo) {
    const lastPoint = points[points.length - 1];
    // 메모 텍스트에 흰색 테두리 추가
    ctx.font = 'bold 14px Noto Sans KR';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // 줄바꿈을 처리하기 위한 메모 분리
    const lines = memo.split('\n');
    let lineHeight = 18; // 줄 높이
    
    lines.forEach((line, index) => {
      ctx.strokeText(line, lastPoint.x + 10, lastPoint.y + 10 + (index * lineHeight));
      ctx.fillStyle = '#000';
      ctx.fillText(line, lastPoint.x + 10, lastPoint.y + 10 + (index * lineHeight));
    });
  }
}

// 화살표 그리기 - 테두리 없음
function drawArrow(fromX, fromY, toX, toY, color, width) {
  // 화살표 크기를 선 굵기에 비례하게 조정
  const headLength = Math.max(12, width * 5);
  const headWidth = Math.max(8, width * 3);
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  // 선 그리기
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  
  // 화살표 머리 그리기
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / headWidth),
    toY - headLength * Math.sin(angle - Math.PI / headWidth)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / headWidth),
    toY - headLength * Math.sin(angle + Math.PI / headWidth)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 화살표 그리기 - 흰색 테두리 추가
function drawArrowWithOutline(fromX, fromY, toX, toY, color, width) {
  // 화살표 크기를 선 굵기에 비례하게 조정
  const headLength = Math.max(12, width * 5);
  const headWidth = Math.max(8, width * 3);
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  // 흰색 테두리 선 그리기
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = width + 2; // 테두리 굵기 감소
  ctx.stroke();
  
  // 실제 색상 선 그리기
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  
  // 흰색 테두리 화살표 머리 그리기
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - (headLength + 2) * Math.cos(angle - Math.PI / headWidth),
    toY - (headLength + 2) * Math.sin(angle - Math.PI / headWidth)
  );
  ctx.lineTo(
    toX - (headLength + 2) * Math.cos(angle + Math.PI / headWidth),
    toY - (headLength + 2) * Math.sin(angle + Math.PI / headWidth)
  );
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // 실제 색상 화살표 머리 그리기
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / headWidth),
    toY - headLength * Math.sin(angle - Math.PI / headWidth)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / headWidth),
    toY - headLength * Math.sin(angle + Math.PI / headWidth)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}