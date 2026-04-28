let capture;
let mode = "0";
let txt = "一二三四五田雷電龕龘";
let captureBtn;
let vidW, vidH, startX, startY;
let bubbles = [];
let span = 15; // 像素大小 (滑鼠滾輪控制)

// ===== ml5.js 手部辨識變數 =====
let handPose;
let hands = [];

function preload() {
  // 載入 HandPose 模型，並設定為鏡像翻轉
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 建立視訊，加入 flipped: true 以配合手勢辨識的鏡像設定
  capture = createCapture(VIDEO, { flipped: true });
  capture.size(640, 480);
  capture.hide();

  // 開始偵測手部
  handPose.detectStart(capture, gotHands);

  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  // 拍照按鈕
  captureBtn = createButton("📸 拍照儲存");
  captureBtn.style("padding", "10px 20px");
  captureBtn.style("font-size", "16px");
  captureBtn.style("background", "#ffffff");
  captureBtn.style("border-radius", "8px");
  captureBtn.style("border", "none");
  captureBtn.mousePressed(takePhoto);

  // 建立泡泡
  for (let i = 0; i < 40; i++) {
    bubbles.push(new Bubble());
  }
}

function gotHands(results) {
  // 儲存偵測到的手部資料
  hands = results;
}

function draw() {
  background("#e7c6ff");

  let img = capture.get();

  vidW = width * 0.6;
  vidH = height * 0.6;

  startX = (width - vidW) / 2;
  startY = (height - vidH) / 2;

  // ===== 模式0 原圖 =====
  if (mode == "0") {
    // 因為 capture 已經設定了 flipped: true，這裡不需要再用 scale(-1, 1) 翻轉
    image(capture, startX, startY, vidW, vidH);
  }
  // ===== 像素模式 =====
  else {
    for (let x = 0; x < vidW; x += span) {
      for (let y = 0; y < vidH; y += span) {
        
        // 因為已經自動翻轉，這裡直接 map x 即可，不需要 vidW - x
        let sx = int(map(x, 0, vidW, 0, img.width));
        let sy = int(map(y, 0, vidH, 0, img.height));

        let pixel = img.get(sx, sy);
        let bk = (pixel[0] + pixel[1] + pixel[2]) / 3;

        let drawX = startX + x;
        let drawY = startY + y;

        // 1 彩色馬賽克
        if (mode == "1") {
          fill(pixel);
          noStroke();
          rect(drawX, drawY, span, span);
        }

        // 2 灰階圓形
        if (mode == "2") {
          let size = map(bk, 0, 255, 0, span);
          fill(255);
          noStroke();
          ellipse(drawX, drawY, size, size);
        }

        // 3 文字雲
        if (mode == "3") {
          fill(pixel);
          textSize(span);
          let bkId = int(map(bk, 0, 255, 9, 0));
          text(txt[bkId], drawX, drawY);
        }
      }
    }
  }

  // ===== 畫出手部節點 =====
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // 判斷左右手給予不同顏色
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }
          noStroke();

          // 關鍵：將原始 640x480 的座標，轉換到你目前畫布上的縮放與置中位置
          let mappedX = startX + map(keypoint.x, 0, 640, 0, vidW);
          let mappedY = startY + map(keypoint.y, 0, 480, 0, vidH);

          circle(mappedX, mappedY, 16);
        }
      }
    }
  }

  // ===== 泡泡效果 =====
  for (let b of bubbles) {
    b.move();
    b.display();
  }

  // UI文字與按鈕位置
  fill(0);
  textSize(16);
  text(
    "0:原圖  1:馬賽克  2:圓形  3:文字雲  | 滾輪調整像素大小",
    width / 2,
    height - 20
  );

  captureBtn.position(width / 2 - 60, startY + vidH + 20);
}

// 滑鼠滾輪控制像素大小
function mouseWheel(event) {
  span -= event.delta * 0.01;
  span = constrain(span, 4, 80);
  return false;
}

// 泡泡 class
class Bubble {
  constructor() {
    this.x = random(width);
    this.y = random(height, height + 200);
    this.r = random(10, 30);
    this.speed = random(0.5, 2);
  }

  move() {
    this.y -= this.speed;
    this.x += random(-0.5, 0.5);

    if (this.y < -this.r) {
      this.y = height + this.r;
      this.x = random(width);
    }
  }

  display() {
    noStroke();
    fill(255, 255, 255, 120);
    circle(this.x, this.y, this.r * 2);
  }
}

// 拍照
function takePhoto() {
  let img = get(startX, startY, vidW, vidH);
  img.save("snapshot", "jpg");
}

// 按鍵切換模式
function keyPressed() {
  if (key == "0") mode = "0";
  if (key == "1") mode = "1";
  if (key == "2") mode = "2";
  if (key == "3") mode = "3";
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}