let video = document.getElementById("video");
let modelForFaceDetection;
let modelForEmotionRecognition;
// declare a canvas variable and get its context
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let x1, y1, x2, y2;
let currentEmotion = "test";


const emotions = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "neutral",
    5: "sad",
    6: "surprise",
}

const setupCamera = async () => {
    navigator.mediaDevices
        .getUserMedia({
            video: {width: 1920, height: 1080},
            audio: false,
        })
        .then((stream) => {
            video.srcObject = stream;
        });
    modelForFaceDetection = await blazeface.load();
    modelForEmotionRecognition = await tf.loadLayersModel('https://raw.githubusercontent.com/Im-Rises/emotion-recognition-website/main/resnet50js_ferplus/model.json');

};

const getIndexOfMax = (pred) => R.indexOf(getMax(pred), pred);

const getMax = (pred) => {
    let acc = 0;
    for (let i of pred)
        if (i > acc)
            acc = i;
    return acc;
}

const getBestEmotion = (pred) => emotions[getIndexOfMax(pred)];

const detectFaces = async () => {
    const face = await modelForFaceDetection.estimateFaces(video, false);

    // Clear all previous rectangles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw the video first
    ctx.drawImage(video, 0, 0, 1920, 1080);

    if (face.length > 0) {
        // save face to test_face_extract folder
        for (const face1 of face) {
            [y1, x1] = face1.topLeft;
            [y2, x2] = face1.bottomRight;

            ctx.beginPath();
            ctx.lineWidth = "2";
            ctx.strokeStyle = "red";

            const width = y2 - y1;
            const height = x2 - x1;

            ctx.rect(
                y1,
                x1 - height / 2,
                width,
                height + height * 2 / 3,
            );
            ctx.stroke();


            let img = ctx.getImageData(y1,
                x1 - height / 2,
                width,
                height + height * 2 / 3,
            );

            // let resized = tf.browser.fromPixels(img).resizeNearestNeighbor([80, 80]);
            // let resized = tf.browser.fromPixels(img).resizeBicubic([80, 80]);
            let resized = tf.browser.fromPixels(img).resizeBilinear([80, 80]);
            resized = resized.reshape([1, 80, 80, 3]);

            let prediction = Array.from(modelForEmotionRecognition.predict(resized).dataSync());

            currentEmotion = getBestEmotion(prediction);

            ctx.fillText(currentEmotion, x1, y1);
            ctx.font = "30px Impact";
            ctx.fillStyle = "red";
        }
    }
};

setupCamera();
video.addEventListener("loadeddata", async () => {
    setInterval(detectFaces, 100);
});
