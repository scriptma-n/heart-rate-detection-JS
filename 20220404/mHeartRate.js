const video = document.getElementById('video')
var mBeatSound = new Audio("../sound/heartbeat.mp3");
//var img_face = new Image();
//img_face.src = './christmas_mark03_boy.png';// If you want to hide your face


function startVideo() {

  if (navigator.userAgent.match(/iPhone|iPad|Android/)) { ///iPhone|Android.+Mobile/
    console.log("Mobile");
     video.width = 400; //1080;

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(localMediaStream => {
      if ('srcObject' in video) {
        video.srcObject = localMediaStream;
      } else {
        video.src = window.URL.createObjectURL(localMediaStream);
      }
      video.play();
    })
    .catch(err => {
      console.error(`Not available!!!!`, err);
    });

  } 
  else {
    console.log("PC");
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
      )    
  }
  console.log("video:"+[video.width, video.height]);

}

startVideo()

video.addEventListener('play', () => {

  var canvas_bg = document.createElement("canvas");
  canvas_bg.width = video.width;
  canvas_bg.height = video.height;
  document.body.append(canvas_bg)
  var ctx_bg = canvas_bg.getContext('2d');
  // ctx_bg.fillStyle = "rgb(0,0,0)";
  // ctx_bg.fillRect(0, 0, video.width, video.height/2);

  var canvas_face = document.createElement("canvas");
  canvas_face.width = video.width;
  canvas_face.height = video.height;
  var ctx_face = canvas_face.getContext('2d'); //not appenc

  
  var t1 = performance.now();
  var greenV = [];
  var frame_num = 0;
  var mVideoFPS = 30;
  var mCurrentFPS = 0
  var mLastBeatFrame = 0;
  var mLastBeatTime = 0;
  var mHeartRate = 0
  
  setInterval(async () => {
    
    frame_num += 1;
    ctx_bg.clearRect(0, 0, canvas_bg.width, canvas_bg.height)
    ctx_face.clearRect(0, 0, canvas_face.width, canvas_face.height)
    ctx_face.drawImage(video, 0, 0, video.width, video.height);
    
    //--- monotoring area, face image ---//
    var s_ = 600
    var xs_ = video.width/2 - s_/2
    var xe_ = video.width/2 + s_/2
    var ys_ = -200
    var ye_ = ys_+s_

    //ctx_bg.drawImage(img_face, xs_, ys_, s_, s_); // If you want to hide your face

    s_ = 200
    xs_ = video.width/2 - s_/2
    xe_ = video.width/2 + s_/2
    ys_ = video.height/2 -s_/2
    ye_ = video.height/2 + s_/2
    ctx_bg.strokeStyle = "rgb(255,0,0)";
    ctx_bg.strokeRect(xs_, ys_, xe_-xs_, ye_-ys_)
    
    //--- Green value ---//
    var frame = ctx_face.getImageData(0, 0, video.width, video.height);
    
    var p_ = xs_ + ys_*video.width
    //console.log("p_:"+p_);
    var v_ = frame.data[p_*4+1]
    //console.log("v_:"+v_);
    var sum_ = 0;
    for(var y=ys_;y<ye_;y++){
      for(var x=xs_;x<xe_;x++){
          p_ = x + y*video.width
          v_ = frame.data[p_*4+1]
          sum_ += v_
      }
    }
    //console.log("sum_:"+sum_);
    
    sum_ = sum_ / (xe_-xs_) / (ye_-ys_)
    //console.log("sum_:"+sum_);
 
    greenV.push( sum_ );
    var max_v_ = greenV[0]*1.001
    var min_v_ = greenV[0]
    var Nsamp_ = 128
    if(greenV.length>Nsamp_){
        greenV.shift();
    }

    for(var i=0;i<greenV.length;i++){
      v_ = greenV[i]
      if(max_v_<v_){
        max_v_ = v_
      }
      if(min_v_>v_){
          min_v_ = v_
      }
    }

    let smoothV = []
    smoothV[0] = greenV[0]
    smoothV[greenV.length-1] = greenV[greenV.length-1]
    for(var i=1;i<greenV.length-1;i++){
        smoothV[i] = greenV[i-1]*0.25 +
                     greenV[i]*0.5 +
                     greenV[i+1]*0.25 
    }

    //--- Sound ---//
    p_ = smoothV.length-1 - 3
    if( (smoothV[p_] > smoothV[p_-1]) &&
        (smoothV[p_] > smoothV[p_+1]) &&
        (smoothV[p_+1] > smoothV[p_+2]) &&
        (smoothV[p_+2] > smoothV[p_+3])  )
    {
      if( frame_num >= mLastBeatFrame + mVideoFPS/2){
        mBeatSound.pause();
        mBeatSound.currentTime = 0;
        mBeatSound.play();
        mLastBeatFrame = frame_num        

        var t3 = performance.now();
        mHeartRate = Math.floor(1000.0/(t3-mLastBeatTime)*60.0)
        mLastBeatTime = t3
      }
    }

    //--- Graph ---//
    if(greenV.length>1){
      ctx_bg.strokeStyle = 'red';
      ctx_bg.lineWidth = 5;
      var Ox = 0;
      var Oy = canvas_bg.height/2;
      var Lx = canvas_bg.width;
      var Ly = canvas_bg.height/2;
      var vx = 0/greenV.length * Lx;
      var vy = (greenV[0]-min_v_) / (max_v_-min_v_) * Ly;
      ctx_bg.beginPath();
      ctx_bg.moveTo(Ox+vx, Oy-vy);
      for(var i=1;i<greenV.length;i++){
        vx = i/greenV.length * Lx;
        vy = (greenV[i]-min_v_) / (max_v_-min_v_) * Ly;
        ctx_bg.lineTo(Ox+vx, Oy-vy);
      }
      ctx_bg.stroke();

      ctx_bg.strokeStyle = 'cyan';
      ctx_bg.lineWidth = 3;
      vx = 0/smoothV.length * Lx;
      vy = (smoothV[0]-min_v_) / (max_v_-min_v_) * Ly;
      ctx_bg.beginPath();
      ctx_bg.moveTo(Ox+vx, Oy-vy);
      for(var i=1;i<smoothV.length;i++){
        vx = i/smoothV.length * Lx;
        vy = (smoothV[i]-min_v_) / (max_v_-min_v_) * Ly;
        ctx_bg.lineTo(Ox+vx, Oy-vy);
      }
      ctx_bg.stroke();

    }//

    var t2 = performance.now();//ms
    if(frame_num%30==0){
      mCurrentFPS = Math.floor(1000.0/(t2-t1))
    }
    ctx_bg.font = "48px serif";
    ctx_bg.fillStyle = 'rgb(255,0,255)'
    ctx_bg.fillText("FPS:"+ mCurrentFPS, 10, 50);  
    ctx_bg.fillText(" HR:"+ mHeartRate, 10, 100);  
    t1 = t2;

  }, 1000/mVideoFPS)

})