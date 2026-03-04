# Face-API.js Models

Download the following model files from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required models for attendance face detection:
- tiny_face_detector_model-shard1
- tiny_face_detector_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_landmark_68_model-weights_manifest.json

Or run this command to download automatically:
```bash
# From the frontend/public/models directory
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
```
