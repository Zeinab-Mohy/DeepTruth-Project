from flask import Flask, render_template, request, jsonify
from torch.autograd import Variable
import time
import sys
from torch import nn
from torchvision import models
import torch
import torchvision
from torchvision import transforms
from torch.utils.data import DataLoader, Dataset
import os
import numpy as np
import cv2
import matplotlib.pyplot as plt
import face_recognition

# app = Flask(__name__)

# Define a directory for storing uploaded videos
# UPLOAD_FOLDER = 'D:\Final Project\Back-end-flask\\test-video\\tmp'
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Define the Model class
class Model(nn.Module):
    def __init__(self, num_classes, latent_dim=2048, lstm_layers=1, hidden_dim=2048, bidirectional=False):
        super(Model, self).__init__()
        model = models.resnext50_32x4d(pretrained=True)
        self.model = nn.Sequential(*list(model.children())[:-2])
        self.lstm = nn.LSTM(latent_dim, hidden_dim, lstm_layers, bidirectional)
        self.relu = nn.LeakyReLU()
        self.dp = nn.Dropout(0.4)
        self.linear1 = nn.Linear(2048, num_classes)
        self.avgpool = nn.AdaptiveAvgPool2d(1)
    
    def forward(self, x):
        batch_size, seq_length, c, h, w = x.shape
        x = x.view(batch_size * seq_length, c, h, w)
        fmap = self.model(x)
        x = self.avgpool(fmap)
        x = x.view(batch_size, seq_length, 2048)
        x_lstm,_ = self.lstm(x, None)
        return fmap, self.dp(self.linear1(x_lstm[:, -1, :]))

# Define the Validation Dataset class
class validation_dataset(Dataset):
    def __init__(self, video_names, sequence_length=60, transform=None):
        self.video_names = video_names
        self.transform = transform
        self.count = sequence_length
    
    def __len__(self):
        return len(self.video_names)
    def __getitem__(self,idx):
        video_path = self.video_names[idx]
        frames = []
        a = int(100/self.count)
        first_frame = np.random.randint(0,a)
        for i,frame in enumerate(self.frame_extract(video_path)):
            #if(i % a == first_frame):
            faces = face_recognition.face_locations(frame)
            try:
                top,right,bottom,left = faces[0]
                frame = frame[top:bottom,left:right,:]
            except:
                pass
            frames.append(self.transform(frame))
            if(len(frames) == self.count):
                break
        print("Total frames extracted:", len(frames))  # Debug print
        #print("no of frames",len(frames))
        if len(frames) == 0:
            return None  # Return None if frames list is empty
        frames = torch.stack(frames)
        frames = frames[:self.count]
        print("Final number of frames:", len(frames))  # Debug print
        return frames.unsqueeze(0)

    def frame_extract(self, path):
            vidObj = cv2.VideoCapture(path)
            success = 1
            frame_count = 0
            while success:
                success, image = vidObj.read()
                if success:
                    frame_count += 1
                    print(f"Frame {frame_count} read successfully.")
                    yield image
            print(f"Total frames extracted: {frame_count}")
# Define transformations
im_size = 112
mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]
train_transforms = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((im_size, im_size)),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)])

sm = nn.Softmax()
inv_normalize =  transforms.Normalize(mean=-1*np.divide(mean,std),std=np.divide([1,1,1],std))

def im_convert(tensor):
    """ Display a tensor as an image. """
    image = tensor.to("cpu").clone().detach()
    image = image.squeeze()
    image = inv_normalize(image)
    image = image.numpy()
    image = image.transpose(1,2,0)
    image = image.clip(0, 1)
    cv2.imwrite('./2.png',image*255)
    return image

# Define the predict function
def predict(model,img,path = './'):
    fmap,logits = model(img)
    params = list(model.parameters())
    weight_softmax = model.linear1.weight.detach().cpu().numpy()
    logits = sm(logits)
    _,prediction = torch.max(logits,1)
    confidence = logits[:,int(prediction.item())].item()*100
    print('confidence of prediction:',logits[:,int(prediction.item())].item()*100)
    idx = np.argmax(logits.detach().cpu().numpy())
    bz, nc, h, w = fmap.shape
    out = np.dot(fmap[-1].detach().cpu().numpy().reshape((nc, h*w)).T,weight_softmax[idx,:].T)
    predict = out.reshape(h,w)
    predict = predict - np.min(predict)
    predict_img = predict / np.max(predict)
    predict_img = np.uint8(255*predict_img)
    out = cv2.resize(predict_img, (im_size,im_size))
    heatmap = cv2.applyColorMap(out, cv2.COLORMAP_JET)
    img = im_convert(img[:,-1,:,:,:])
    result = heatmap * 0.5 + img*0.8*255
    cv2.imwrite('/content/1.png',result)
    result1 = heatmap * 0.5/255 + img*0.8
    r,g,b = cv2.split(result1)
    result1 = cv2.merge((r,g,b))
    # plt.imshow(result1)
    # plt.show()
    return [int(prediction.item()),confidence]

# Set video paths and model path
# @app.route('/')
# def index():
#     return render_template('index.html')

# @app.route('/process_video', methods=['POST'])
# def process_video():
#     # Check if video file is present in the request
#     if 'video' not in request.files:
#         return jsonify({'error': 'No video uploaded!'})

#     # Get the uploaded video file
#     video_file = request.files['video']
#     if video_file.filename == '':
#         return jsonify({'error': 'No selected file!'})

#     # Save the video file temporarily
#     video_filename = 'uploaded_video.mp4'
#     path_to_videos = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
#     video_file.save(path_to_videos)
#     print("Video file path:", path_to_videos)

#     path_to_model = 'D:\Final Project\Back-end-flask\\test-video\model_93_acc_100_frames_celeb_FF_data.pt'
    
#     # Create validation dataset and load the model
#     video_dataset = validation_dataset([path_to_videos], sequence_length=10, transform=train_transforms)
#     model = Model(2)
#     model.load_state_dict(torch.load(path_to_model, map_location=torch.device('cpu')))
#     model.eval()
    
#     # Predict and print results
#     prediction = predict(model, video_dataset[0])
#     print("Prediction:", prediction)
#     return jsonify({'prediction': prediction[0]})

# if __name__ == '__main__':
#     app.run(port=5000, debug=True)
