# Video compression microservice

Sometimes original videos uploaded by users are too big, and its unoptimal to deliver it to other users device in initial state. We want to compress it to decrease network usage and improve end user experience.

This microservice receiving original video url in request (coming through pubsub), downloads it, and compress using ffmpeg library:

1. generate thumbnail if necessary
2. compress thumbnail into 3 different qualities if necessary
3. compress video into 2 different qualities

ATTENTION: This is only one part of the media processing system! Article describing the entire system can be found [here](https://dmitry-barabash.medium.com/photo-and-video-compression-pipeline-in-modern-web-applications-921fa2988628).

## Demonstration

![Architecture Schema](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*LageXJCBgNoeCWhf82jhSw.jpeg)

https://user-images.githubusercontent.com/64595561/232421891-316f282e-ea2c-4c54-bb9d-0a1bc01e535c.mp4
